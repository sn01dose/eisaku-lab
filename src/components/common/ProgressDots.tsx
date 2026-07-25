import { classNames } from "../classNames";

export interface ProgressDotsProps {
  current: number;
  total: number;
  className?: string;
  label?: string;
}

export function ProgressDots({
  current,
  total,
  className,
  label,
}: ProgressDotsProps): React.JSX.Element {
  const safeTotal = Math.max(1, Math.floor(total));
  const safeCurrent = Math.min(Math.max(0, Math.floor(current)), safeTotal);
  const accessibleLabel =
    label ?? `${safeTotal}問中${safeCurrent}問まで完了しました`;

  return (
    <div
      className={classNames("progress-dots", className)}
      role="img"
      aria-label={accessibleLabel}
    >
      {Array.from({ length: safeTotal }, (_, index) => {
        const number = index + 1;
        return (
          <span
            className={classNames(
              "progress-dots__dot",
              number <= safeCurrent && "progress-dots__dot--done",
              number === safeCurrent + 1 && "progress-dots__dot--current",
            )}
            aria-hidden="true"
            key={number}
          />
        );
      })}
    </div>
  );
}
