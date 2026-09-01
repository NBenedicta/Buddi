"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-purple-300 cursor-pointer",
        className
      )}
    >
      {/* Both icons render at all times; CSS (not JS state) decides which is
          visible, so there's nothing here that can differ between the
          server's render and the client's first paint. */}
      <Sun size={19} className="dark:hidden" />
      <Moon size={19} className="hidden dark:block" />
    </button>
  );
}
