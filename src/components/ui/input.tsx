import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, helperText, error, id, ...props }, ref) => {
    const fallbackId = React.useId();
    const inputId = id || fallbackId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="mono-label block text-ink-soft dark:text-forest-200/80"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-invalid={!!error}
          className={cn(
            // Cohere: rectangular (radius-xs), thin hairline border, focus ring.
            "flex h-11 w-full rounded-xs border border-hairline-strong bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70 focus-visible:border-forest-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-forest-700 dark:bg-forest-950 dark:text-forest-50 dark:placeholder:text-forest-200/40 dark:focus-visible:border-forest-400",
            {
              "border-clay-500 focus-visible:border-clay-500 focus-visible:ring-clay-500/30":
                !!error,
            },
            className
          )}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-clay-600 dark:text-clay-300"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-ink-muted dark:text-forest-200/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
