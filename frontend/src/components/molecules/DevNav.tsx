"use client";

import { usePathname, useRouter } from "next/navigation";

const SCREENS = [
  { n: 1, label: "Home",     path: "/"          },
  { n: 2, label: "Sandbox",  path: "/sandbox"   },
  { n: 3, label: "Document", path: "/document"  },
  { n: 4, label: "—",        path: "#"          },
] as const;

/**
 * DevNav — temporary dev-only screen switcher.
 * Fixed bottom-left. Only rendered when NODE_ENV === "development".
 */
export function DevNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <nav
      className="fixed bottom-4 left-4 z-[9999] flex items-center gap-1"
      aria-label="Dev screen switcher"
    >
      {SCREENS.map(({ n, label, path }) => {
        const active = pathname === path;
        return (
          <button
            key={n}
            onClick={() => path !== "#" && router.push(path)}
            title={label}
            disabled={path === "#"}
            className="w-7 h-7 rounded text-[11px] font-mono font-bold leading-none transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: active ? "#FFB300" : "rgba(45,24,23,0.75)",
              color: active ? "#1a0f0c" : "#f8f8f8",
              border: "1px solid rgba(255,179,0,0.3)",
            }}
          >
            {n}
          </button>
        );
      })}
    </nav>
  );
}
