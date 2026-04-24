"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ThemeToggle Atom
 * Extracts Pencil Node IDs:
 * - LqI9j (Light Mode Active state)
 * - 9DmQ7 (Dark Mode Active state)
 */
export const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid Hydration Mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a skeleton matching the layout to prevent CLS
    return <div className="w-[72px] h-[32px] rounded-full" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      ref={ref}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "hf-pressable relative flex items-center w-[72px] h-[32px] rounded-full p-[1px] transition-colors duration-200",
        "hover:brightness-[1.04] active:brightness-[0.96]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]",
        isDark
          ? "bg-[#2D1817] ring-1 ring-inset ring-[#A55B3766]"
          : "bg-[#C8B8B6] ring-1 ring-inset ring-[#D2B48C]",
        className,
      )}
      aria-label="Toggle Theme"
      {...props}
    >
      <div className="absolute inset-x-0 mx-auto flex w-full justify-between items-center px-[2px]">
        {/* Sun Container */}
        <div
          className={cn(
            "flex items-center justify-center w-[28px] h-[28px] rounded-full transition-colors duration-200 z-10",
            !isDark ? "bg-[#FFB300]" : "bg-transparent",
          )}
        >
          <Sun
            className={cn(
              "w-4 h-4 transition-colors duration-200",
              !isDark ? "text-[#2D1817]" : "text-[#A55B3766]",
            )}
            strokeWidth={2}
          />
        </div>

        {/* Moon Container */}
        <div
          className={cn(
            "flex items-center justify-center w-[28px] h-[28px] rounded-full transition-colors duration-200 z-10",
            isDark ? "bg-[#FFB300]" : "bg-transparent",
          )}
        >
          <Moon
            className={cn(
              "w-4 h-4 transition-colors duration-200",
              isDark ? "text-[#1A1110]" : "text-[#4A3B39]",
            )}
            strokeWidth={2}
          />
        </div>
      </div>
    </button>
  );
});

ThemeToggle.displayName = "ThemeToggle";
