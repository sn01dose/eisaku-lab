import {
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { classNames } from "../classNames";
import {
  createFallbackOperations,
  expandOperations,
  groupOperations,
  resolveChunkLengths,
  type ExpandedLetterCellOperation,
  type LetterCellOperation,
} from "./letterCellOperations";
import { ENGLISH_INPUT_PROPS } from "./inputPolicy";

export type {
  LetterCellOperation,
  LetterCellOperationType,
} from "./letterCellOperations";

export interface LetterCellsProps {
  value: string;
  mode?: "input" | "graded";
  correctAnswer?: string;
  operations?: readonly LetterCellOperation[];
  chunks?: readonly string[];
  chunkLabels?: readonly string[];
  expectedLength?: number;
  minCells?: number;
  label?: string;
  feedback?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onHint?: () => void;
}

function TransposeCells({
  operation,
}: {
  operation: ExpandedLetterCellOperation;
}): React.JSX.Element {
  return (
    <span className="letter-cells__transpose">
      {[...operation.actual].map((character, index) => (
        <span className="letter-cell letter-cell--transpose" key={index}>
          <span className="letter-cell__main">{character}</span>
          <span className="letter-cell__correction">
            {operation.expected[index] ?? ""}
          </span>
        </span>
      ))}
      <svg
        className="letter-cells__transpose-arc"
        viewBox="0 0 52 15"
        aria-hidden="true"
      >
        <path d="M3 13 C12 1, 40 1, 49 13" />
      </svg>
    </span>
  );
}

function GradedCell({
  operation,
}: {
  operation: ExpandedLetterCellOperation;
}): React.JSX.Element {
  if (operation.type === "transpose") {
    return <TransposeCells operation={operation} />;
  }

  const shownCharacter =
    operation.type === "delete" ? "\u00a0" : operation.actual || "\u00a0";

  return (
    <span
      className={classNames(
        "letter-cell",
        `letter-cell--${operation.type}`,
      )}
    >
      <span className="letter-cell__main">{shownCharacter}</span>
      {(operation.type === "substitute" || operation.type === "delete") && (
        <span className="letter-cell__correction">{operation.expected}</span>
      )}
    </span>
  );
}

export function LetterCells({
  value,
  mode = "input",
  correctAnswer = "",
  operations,
  chunks,
  chunkLabels,
  expectedLength,
  minCells = 6,
  label = "英単語の綴りを入力",
  feedback,
  disabled = false,
  className,
  onChange,
  onSubmit,
  onHint,
}: LetterCellsProps): React.JSX.Element {
  const inputGroupRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const feedbackId = useId();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const answerLength = [...correctAnswer].length;
  const visualLength =
    expectedLength ??
    (answerLength > 0
      ? answerLength
      : Math.max(minCells, [...value].length + (disabled ? 0 : 1)));
  const chunkLengths = useMemo(
    () => resolveChunkLengths(chunks, visualLength),
    [chunks, visualLength],
  );
  const expandedOperations = useMemo(
    () =>
      expandOperations(
        operations ?? createFallbackOperations(correctAnswer, value),
      ),
    [correctAnswer, operations, value],
  );
  const gradedGroups = useMemo(
    () => groupOperations(expandedOperations, chunkLengths),
    [chunkLengths, expandedOperations],
  );
  const inputCharacters = [...value];
  const totalVisualCharacters = Math.max(
    visualLength,
    inputCharacters.length,
  );
  const sizeClass =
    totalVisualCharacters > 18
      ? "letter-cells--extra-long"
      : totalVisualCharacters > 12
        ? "letter-cells--long"
        : undefined;

  const focusCell = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(index, visualLength - 1));
    inputRefs.current[boundedIndex]?.focus();
  };

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextCharacters = [...value].slice(0, visualLength);
    const enteredCharacters = [...event.currentTarget.value];

    if (enteredCharacters.length === 0) {
      if (index < nextCharacters.length) {
        nextCharacters.splice(index, 1);
        onChange?.(nextCharacters.join(""));
      }
      return;
    }

    const targetIndex = Math.min(index, nextCharacters.length);
    nextCharacters[targetIndex] =
      enteredCharacters[enteredCharacters.length - 1];
    onChange?.(nextCharacters.join(""));
    focusCell(Math.min(targetIndex + 1, visualLength - 1));
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && onSubmit) {
      event.preventDefault();
      onSubmit(value);
    } else if (event.key === "?" && onHint) {
      event.preventDefault();
      onHint();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusCell(index - 1);
    } else if (event.key === "ArrowRight" && index < visualLength - 1) {
      event.preventDefault();
      focusCell(index + 1);
    } else if (event.key === "Backspace") {
      const nextCharacters = [...value].slice(0, visualLength);

      if (nextCharacters[index]) {
        event.preventDefault();
        nextCharacters.splice(index, 1);
        onChange?.(nextCharacters.join(""));
        return;
      }

      if (index > 0) {
        event.preventDefault();
        nextCharacters.splice(index - 1, 1);
        onChange?.(nextCharacters.join(""));
        focusCell(index - 1);
      }
    }
  };

  const handlePaste = (
    index: number,
    event: ClipboardEvent<HTMLInputElement>,
  ) => {
    const pastedCharacters = [
      ...event.clipboardData.getData("text"),
    ];
    if (pastedCharacters.length === 0) return;

    event.preventDefault();
    const nextCharacters = [...value].slice(0, visualLength);
    const targetIndex = Math.min(index, nextCharacters.length);
    const availableLength = visualLength - targetIndex;
    const acceptedCharacters = pastedCharacters.slice(0, availableLength);

    nextCharacters.splice(
      targetIndex,
      acceptedCharacters.length,
      ...acceptedCharacters,
    );
    onChange?.(nextCharacters.slice(0, visualLength).join(""));
    focusCell(
      Math.min(targetIndex + acceptedCharacters.length, visualLength - 1),
    );
  };

  const handleFocus = (
    index: number,
    event: FocusEvent<HTMLInputElement>,
  ) => {
    const wasOutsideGroup = focusedIndex === null;
    setFocusedIndex(index);
    event.currentTarget.select();

    if (wasOutsideGroup) {
      requestAnimationFrame(() => {
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        inputGroupRef.current?.scrollIntoView({
          block: "center",
          behavior: reducedMotion ? "auto" : "smooth",
        });
      });
    }
  };

  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (!inputGroupRef.current?.contains(document.activeElement)) {
        setFocusedIndex(null);
      }
    });
  };

  const accessibleResult = `正解 ${correctAnswer}、あなたの解答 ${
    value || "無回答"
  }`;

  return (
    <div
      className={classNames(
        "letter-cells",
        `letter-cells--${mode}`,
        sizeClass,
        focusedIndex !== null && "letter-cells--focused",
        className,
      )}
    >
      <div
        className="letter-cells__input-surface"
        role={mode === "graded" ? "img" : undefined}
        aria-label={mode === "graded" ? accessibleResult : undefined}
      >
        <div
          ref={mode === "input" ? inputGroupRef : undefined}
          className="letter-cells__groups"
          role={mode === "input" ? "group" : undefined}
          aria-label={mode === "input" ? label : undefined}
          aria-describedby={
            mode === "input" && feedback ? feedbackId : undefined
          }
          aria-roledescription={
            mode === "input" ? "1文字ずつ入力する綴り欄" : undefined
          }
          aria-hidden={mode === "graded" ? "true" : undefined}
        >
          {chunkLengths.map((chunkLength, groupIndex) => {
            const start = chunkLengths
              .slice(0, groupIndex)
              .reduce((sum, length) => sum + length, 0);
            const isLastGroup = groupIndex === chunkLengths.length - 1;
            const extraCount = mode === "graded" && isLastGroup
              ? Math.max(0, inputCharacters.length - visualLength)
              : 0;
            const groupInputCharacters = inputCharacters.slice(
              start,
              start + chunkLength + extraCount,
            );

            return (
              <span className="letter-cells__group" key={groupIndex}>
                <span className="letter-cells__row">
                  {mode === "graded"
                    ? gradedGroups[groupIndex].map((operation, index) => (
                        <GradedCell
                          operation={operation}
                          key={`${operation.type}-${index}`}
                        />
                      ))
                    : Array.from(
                        { length: chunkLength + extraCount },
                        (_, index) => {
                          const absoluteIndex = start + index;
                          const character = groupInputCharacters[index] ?? "";

                          return (
                            <span
                              className={classNames(
                                "letter-cell",
                                character && "letter-cell--filled",
                                focusedIndex === absoluteIndex &&
                                  "letter-cell--active",
                              )}
                              key={absoluteIndex}
                            >
                              <input
                                {...ENGLISH_INPUT_PROPS}
                                ref={(element) => {
                                  inputRefs.current[absoluteIndex] = element;
                                }}
                                className="letter-cell__input"
                                type="text"
                                value={character}
                                maxLength={1}
                                onChange={(event) =>
                                  handleChange(absoluteIndex, event)
                                }
                                onKeyDown={(event) =>
                                  handleKeyDown(absoluteIndex, event)
                                }
                                onPaste={(event) =>
                                  handlePaste(absoluteIndex, event)
                                }
                                onFocus={(event) =>
                                  handleFocus(absoluteIndex, event)
                                }
                                onBlur={handleBlur}
                                aria-label={`${absoluteIndex + 1}文字目（全${visualLength}文字）`}
                                data-input-policy-id="spelling.answer"
                                enterKeyHint="done"
                                disabled={disabled}
                              />
                            </span>
                          );
                        },
                      )}
                </span>
                {chunks && <span className="letter-cells__chunk-rule" />}
                {chunks &&
                  (chunkLabels === undefined
                    ? chunks[groupIndex]
                    : chunkLabels[groupIndex]) && (
                    <span className="letter-cells__chunk-label">
                      {chunkLabels === undefined
                        ? chunks[groupIndex]
                        : chunkLabels[groupIndex]}
                    </span>
                  )}
              </span>
            );
          })}
        </div>
      </div>
      {feedback && (
        <p className="letter-cells__feedback" id={feedbackId} aria-live="polite">
          {feedback}
        </p>
      )}
    </div>
  );
}
