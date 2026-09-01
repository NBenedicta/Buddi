import * as React from "react";
import { cn } from "@/lib/utils";

const fieldDark =
  "dark:border-purple-900/50 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500 dark:focus:ring-purple-500/20";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-50",
      fieldDark,
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
      fieldDark,
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("text-sm font-medium text-gray-700 dark:text-gray-300", className)}
    {...props}
  />
);

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm text-gray-900 transition-colors focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-50",
      fieldDark,
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";
