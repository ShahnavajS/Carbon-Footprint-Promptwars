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
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          // Variants
          {
            "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:outline-emerald-600":
              variant === "primary",
            "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 focus-visible:outline-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700":
              variant === "secondary",
            "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800":
              variant === "outline",
            "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:outline-slate-600 dark:text-slate-400 dark:hover:bg-slate-800":
              variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-600":
              variant === "danger",
          },
          // Sizes
          {
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-4 text-base": size === "md",
            "h-12 px-6 text-lg": size === "lg",
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
