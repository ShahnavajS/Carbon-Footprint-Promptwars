import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          // Variants — Cohere system:
          //   primary   → forest pill (the one high-priority action)
          //   secondary → underlined text link (NOT a box)
          //   outline   → outlined pill (taxonomy / filters)
          //   ghost     → quiet transparent (nav, toolbars)
          //   danger    → clay pill (destructive)
          {
            "rounded-pill bg-forest-700 px-6 py-3 text-sm text-paper hover:bg-forest-800 active:bg-forest-900 focus-visible:outline-forest-600 dark:bg-forest-600 dark:hover:bg-forest-500":
              variant === "primary",
            "bg-transparent px-1 py-1 text-sm font-medium text-forest-700 underline-offset-4 hover:underline focus-visible:outline-forest-600 dark:text-forest-300":
              variant === "secondary",
            "rounded-pill border border-forest-300 bg-transparent px-5 py-2 text-sm font-medium text-forest-700 hover:bg-forest-50 active:bg-forest-100 focus-visible:outline-forest-600 dark:border-forest-700 dark:text-forest-300 dark:hover:bg-forest-950/40":
              variant === "outline",
            "rounded-md bg-transparent px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-canvas-soft hover:text-ink focus-visible:outline-forest-600 dark:text-forest-200 dark:hover:bg-forest-900/40":
              variant === "ghost",
            "rounded-pill bg-clay-500 px-6 py-3 text-sm text-paper hover:bg-clay-600 active:bg-clay-600 focus-visible:outline-clay-500":
              variant === "danger",
          },
          // Size overrides (text scale only; padding is per-variant).
          {
            "text-xs": size === "sm",
            "text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
