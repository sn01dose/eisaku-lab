import type { ReactNode } from "react";
import { classNames } from "../classNames";

export interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  message,
  action,
  className,
}: EmptyStateProps): React.JSX.Element {
  return (
    <section className={classNames("empty-state", className)}>
      <div>
        <h2 className="empty-state__title">{title}</h2>
        <p className="empty-state__message">{message}</p>
        {action && <div className="empty-state__action">{action}</div>}
      </div>
    </section>
  );
}
