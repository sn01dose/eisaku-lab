import {
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackId = useId();
  const [focused, setFocused] = useState(false);
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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.currentTarget.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && onSubmit) {
      event.preventDefault();
      onSubmit(value);
    } else if (event.key === "?" && onHint) {
      event.preventDefault();
      onHint();
    }
  };

  const handleFocus = () => {
    setFocused(true);
    requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      inputRef.current?.scrollIntoView({
        block: "center",
        behavior: reducedMotion ? "auto" : "smooth",
      });
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
        focused && "letter-cells--focused",
        className,
      )}
    >
      <div
        className="letter-cells__input-surface"
        role={mode === "graded" ? "img" : undefined}
        aria-label={mode === "graded" ? accessibleResult : undefined}
      >
        {mode === "input" && (
          <input
            {...ENGLISH_INPUT_PROPS}
            ref={inputRef}
            className="letter-cells__native-input"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={() => setFocused(false)}
            aria-label={label}
            aria-describedby={feedback ? feedbackId : undefined}
            data-input-policy-id="spelling.answer"
            enterKeyHint="done"
            disabled={disabled}
          />
        )}
        <div className="letter-cells__groups" aria-hidden="true">
          {chunkLengths.map((chunkLength, groupIndex) => {
            const start = chunkLengths
              .slice(0, groupIndex)
              .reduce((sum, length) => sum + length, 0);
            const isLastGroup = groupIndex === chunkLengths.length - 1;
            const extraCount = isLastGroup
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
                          const active =
                            focused &&
                            absoluteIndex ===
                              Math.min(inputCharacters.length, visualLength - 1);

                          return (
                            <span
                              className={classNames(
                                "letter-cell",
                                character && "letter-cell--filled",
                                active && "letter-cell--active",
                              )}
                              key={absoluteIndex}
                            >
                              <span className="letter-cell__main">
                                {character || "\u00a0"}
                              </span>
                            </span>
                          );
                        },
                      )}
                </span>
                <span className="letter-cells__chunk-rule" />
                <span className="letter-cells__chunk-label">
                  {chunkLabels?.[groupIndex] ?? chunks?.[groupIndex] ?? "\u00a0"}
                </span>
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
