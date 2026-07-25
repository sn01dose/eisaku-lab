export type EnglishSpeechRate = 1 | 0.65;

export interface SpeakEnglishOptions {
  rate?: EnglishSpeechRate;
  voice?: SpeechSynthesisVoice | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

const PREFERRED_LANGUAGES = ["en-US", "en-GB"];
const VOICE_WAIT_MS = 1800;

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

export function getEnglishVoices(
  voices: SpeechSynthesisVoice[] = isSpeechSupported()
    ? window.speechSynthesis.getVoices()
    : [],
): SpeechSynthesisVoice[] {
  return voices
    .filter((voice) => /^en(?:-|_)/i.test(voice.lang))
    .sort((left, right) => {
      const leftRank = PREFERRED_LANGUAGES.indexOf(left.lang);
      const rightRank = PREFERRED_LANGUAGES.indexOf(right.lang);
      const normalizedLeftRank =
        leftRank === -1 ? PREFERRED_LANGUAGES.length : leftRank;
      const normalizedRightRank =
        rightRank === -1 ? PREFERRED_LANGUAGES.length : rightRank;

      if (normalizedLeftRank !== normalizedRightRank) {
        return normalizedLeftRank - normalizedRightRank;
      }

      return Number(right.default) - Number(left.default);
    });
}

export function selectEnglishVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  return getEnglishVoices(voices)[0] ?? null;
}

export function waitForEnglishVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) {
    return Promise.resolve([]);
  }

  const synthesis = window.speechSynthesis;
  const available = getEnglishVoices(synthesis.getVoices());
  if (available.length > 0) {
    return Promise.resolve(available);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeout);
      synthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(getEnglishVoices(synthesis.getVoices()));
    };
    const handleVoicesChanged = () => finish();
    const timeout = window.setTimeout(finish, VOICE_WAIT_MS);

    synthesis.addEventListener("voiceschanged", handleVoicesChanged);
  });
}

export function cancelSpeech(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

export async function speakEnglish(
  text: string,
  options: SpeakEnglishOptions = {},
): Promise<boolean> {
  const cleanText = text.trim();
  if (!cleanText || !isSpeechSupported()) {
    options.onError?.("この環境では音声を再生できません。");
    return false;
  }

  const synthesis = window.speechSynthesis;
  const voices = await waitForEnglishVoices();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voice = options.voice ?? selectEnglishVoice(voices);

  utterance.lang = voice?.lang || "en-US";
  utterance.voice = voice;
  utterance.rate = options.rate ?? 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (event) => {
    if (event.error === "canceled" || event.error === "interrupted") {
      options.onEnd?.();
      return;
    }
    options.onError?.("音声を再生できませんでした。意味から答えてください。");
  };

  synthesis.cancel();
  synthesis.speak(utterance);
  return true;
}

export function testEnglishSpeech(): Promise<boolean> {
  return speakEnglish("Writing begins with one clear sentence.");
}
