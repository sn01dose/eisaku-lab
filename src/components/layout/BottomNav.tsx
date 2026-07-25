import { useSyncExternalStore } from "react";
import { classNames } from "../classNames";

type NavIcon = "home" | "study" | "notes" | "progress" | "settings";

interface NavItem {
  label: string;
  href: string;
  path: string;
  icon: NavIcon;
  aliases: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "ホーム", href: "#/", path: "/", icon: "home", aliases: [] },
  {
    label: "学習",
    href: "#/today",
    path: "/today",
    icon: "study",
    aliases: ["/spelling", "/writing", "/simplify", "/stages"],
  },
  {
    label: "ノート",
    href: "#/notes",
    path: "/notes",
    icon: "notes",
    aliases: [],
  },
  {
    label: "進捗",
    href: "#/progress",
    path: "/progress",
    icon: "progress",
    aliases: [],
  },
  {
    label: "設定",
    href: "#/settings",
    path: "/settings",
    icon: "settings",
    aliases: ["/teacher"],
  },
];

function subscribeToHash(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashPath(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  const path = window.location.hash.replace(/^#/, "").split("?")[0];
  return path || "/";
}

function matchesPath(currentPath: string, item: NavItem): boolean {
  const matchesCandidate = (candidate: string) =>
    candidate === "/"
      ? currentPath === "/"
      : currentPath === candidate || currentPath.startsWith(`${candidate}/`);

  return [item.path, ...item.aliases].some(matchesCandidate);
}

export interface BottomNavProps {
  activePath?: string;
  className?: string;
}

export function BottomNav({
  activePath,
  className,
}: BottomNavProps): React.JSX.Element {
  const hashPath = useSyncExternalStore(subscribeToHash, getHashPath, () => "/");
  const currentPath = activePath ?? hashPath;

  return (
    <nav
      className={classNames("bottom-nav", className)}
      aria-label="主なページ"
    >
      <div className="bottom-nav__inner">
        {NAV_ITEMS.map((item) => {
          const active = matchesPath(currentPath, item);

          return (
            <a
              className="bottom-nav__item"
              href={item.href}
              aria-current={active ? "page" : undefined}
              key={item.path}
            >
              <span
                className={`nav-icon nav-icon--${item.icon}`}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
