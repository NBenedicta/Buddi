import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-surface p-6", className)} {...props} />;
}

export function CardFlat({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-flat p-6", className)} {...props} />;
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "avatar"}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover flex-shrink-0", className)}
      />
    );
  }
  return (
    <div
      className={cn("avatar-gradient", className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline" | "success" | "warning";
}) {
  const variants: Record<string, string> = {
    default: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    outline: "border border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300",
    success: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-purple-100 dark:bg-purple-500/15", className)}>
      <div
        className="h-full rounded-full gradient-primary transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
