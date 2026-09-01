import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deterministic initial letter used inside gradient avatars. */
export function initialOf(name: string | null | undefined) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const POST_TYPES = [
  { value: "update", label: "Update", emoji: "📝" },
  { value: "achievement", label: "Achievement", emoji: "🏆" },
  { value: "help_request", label: "Help Request", emoji: "🙋" },
  { value: "reflection", label: "Reflection", emoji: "💭" },
  { value: "milestone", label: "Milestone", emoji: "🎯" },
] as const;

export type PostType = (typeof POST_TYPES)[number]["value"];

export function postTypeMeta(type: string) {
  return POST_TYPES.find((t) => t.value === type) ?? POST_TYPES[0];
}

export const REACTION_EMOJIS = ["👍", "❤️", "🔥", "💪", "🎉"] as const;

export const PRIORITIES = [
  {
    value: "high",
    label: "High",
    emoji: "🔴",
    color:
      "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-900/50",
  },
  {
    value: "medium",
    label: "Medium",
    emoji: "🟡",
    color:
      "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-900/50",
  },
  {
    value: "low",
    label: "Low",
    emoji: "🟢",
    color:
      "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-900/50",
  },
] as const;

export function priorityMeta(priority: string) {
  return PRIORITIES.find((p) => p.value === priority) ?? PRIORITIES[1];
}
