import type { ReactNode } from "react";
import { classNames } from "../classNames";

export interface CardProps {
  children: ReactNode;
  label?: string;
  title?: string;
  raised?: boolean;
  compact?: boolean;
  className?: string;
}

export function Card({
  children,
  label,
  title,
  raised = false,
  compact = false,
  className,
}: CardProps): React.JSX.Element {
  return (
    <section
      className={classNames(
        "card",
        raised && "card--raised",
        compact && "card--compact",
        className,
      )}
    >
      {label && <p className="card__label">{label}</p>}
      {title && <h2 className="card__heading">{title}</h2>}
      {children}
    </section>
  );
}
