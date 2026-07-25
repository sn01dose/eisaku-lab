import type { ReactNode } from "react";
import { classNames } from "../classNames";

export interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  backHref,
  backLabel = "前の画面へ戻る",
  action,
  className,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className={classNames("page-header", className)}>
      {backHref ? (
        <a className="page-header__back" href={backHref} aria-label={backLabel}>
          <span aria-hidden="true">‹</span>
        </a>
      ) : (
        <span aria-hidden="true" />
      )}
      <div className="page-header__content">
        {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
        <h1 className="page-header__title">{title}</h1>
        {description && (
          <div className="page-header__description">{description}</div>
        )}
      </div>
      {action ? (
        <div className="page-header__action">{action}</div>
      ) : (
        <span aria-hidden="true" />
      )}
    </header>
  );
}
