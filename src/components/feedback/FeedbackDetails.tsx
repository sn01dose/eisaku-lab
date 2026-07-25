import type { ReactNode } from "react";
import { classNames } from "../classNames";

export type FeedbackTone = "correct" | "review" | "information";

export interface FeedbackDetailsProps {
  message: string;
  children?: ReactNode;
  tone?: FeedbackTone;
  summary?: string;
  defaultOpen?: boolean;
  className?: string;
}

export function FeedbackDetails({
  message,
  children,
  tone = "information",
  summary = "くわしく",
  defaultOpen = false,
  className,
}: FeedbackDetailsProps): React.JSX.Element {
  return (
    <div
      className={classNames("feedback", `feedback--${tone}`, className)}
      aria-live="polite"
    >
      <p className="feedback__message">{message}</p>
      {children && (
        <details className="feedback__details" open={defaultOpen}>
          <summary className="feedback__summary">{summary}</summary>
          <div className="feedback__body">{children}</div>
        </details>
      )}
    </div>
  );
}
