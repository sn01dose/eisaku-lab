import type { ReactNode } from "react";
import "../../styles/index.css";
import { classNames } from "../classNames";
import { BottomNav } from "./BottomNav";

export interface AppShellProps {
  children: ReactNode;
  activePath?: string;
  hideNavigation?: boolean;
  className?: string;
  mainClassName?: string;
}

export function AppShell({
  children,
  activePath,
  hideNavigation = false,
  className,
  mainClassName,
}: AppShellProps): React.JSX.Element {
  return (
    <div
      className={classNames(
        "app-shell",
        hideNavigation && "app-shell--without-nav",
        className,
      )}
    >
      <a className="app-shell__skip" href="#main-content">
        本文へ移動
      </a>
      <main
        className={classNames("app-shell__main", mainClassName)}
        id="main-content"
      >
        {children}
      </main>
      {!hideNavigation && <BottomNav activePath={activePath} />}
    </div>
  );
}
