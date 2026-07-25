import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelSpeech,
  isSpeechSupported,
  speakEnglish,
  waitForEnglishVoices,
  type EnglishSpeechRate,
} from "./speech";

export type SpeechStatus =
  | "unsupported"
  | "loading"
  | "ready"
  | "speaking"
  | "unavailable";

export interface UseSpeechResult {
  supported: boolean;
  available: boolean;
  speaking: boolean;
  status: SpeechStatus;
  error: string | null;
  voiceName: string | null;
  speak: (text: string, rate?: EnglishSpeechRate) => Promise<boolean>;
  speakSlowly: (text: string) => Promise<boolean>;
  repeat: () => Promise<boolean>;
  test: () => Promise<boolean>;
  cancel: () => void;
}

export function useSpeech(): UseSpeechResult {
  const supported = isSpeechSupported();
  const [status, setStatus] = useState<SpeechStatus>(
    supported ? "loading" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const lastText = useRef("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!supported) {
      return () => {
        mounted.current = false;
      };
    }

    void waitForEnglishVoices().then((voices) => {
      if (!mounted.current) {
        return;
      }
      setVoiceName(voices[0]?.name ?? null);
      setStatus(voices.length > 0 ? "ready" : "unavailable");
    });

    return () => {
      mounted.current = false;
      cancelSpeech();
    };
  }, [supported]);

  const play = useCallback(
    async (text: string, rate: EnglishSpeechRate = 1) => {
      lastText.current = text;
      setError(null);
      const started = await speakEnglish(text, {
        rate,
        onStart: () => {
          if (mounted.current) {
            setStatus("speaking");
          }
        },
        onEnd: () => {
          if (mounted.current) {
            setStatus("ready");
          }
        },
        onError: (message) => {
          if (mounted.current) {
            setError(message);
            setStatus("unavailable");
          }
        },
      });

      if (!started && mounted.current) {
        setError("この環境では音声を再生できません。");
        setStatus("unsupported");
      }
      return started;
    },
    [],
  );

  const repeat = useCallback(
    () => (lastText.current ? play(lastText.current) : Promise.resolve(false)),
    [play],
  );

  const cancel = useCallback(() => {
    cancelSpeech();
    if (mounted.current && supported) {
      setStatus("ready");
    }
  }, [supported]);

  return {
    supported,
    available: status === "ready" || status === "speaking",
    speaking: status === "speaking",
    status,
    error,
    voiceName,
    speak: play,
    speakSlowly: (text) => play(text, 0.65),
    repeat,
    test: () => play("Writing begins with one clear sentence."),
    cancel,
  };
}
