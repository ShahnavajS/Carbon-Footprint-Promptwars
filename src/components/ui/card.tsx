import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card — flat editorial surface (Cohere "mostly flat").
 *
 * Default: hairline border on paper, NO shadow. Depth comes from surface
 * alternation + borders, not drop shadows. Pass a `shadow-*` class or the
 * `CardMedia` variant when a lift is genuinely needed.
 */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-hairline bg-paper text-ink dark:border-forest-800 dark:bg-forest-900 dark:text-forest-50",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

/**
 * CardMedia — the one "media moment" surface (hero image, planet, projection).
 * Larger radius (22px) and an optional soft lift per DESIGN.md hero-photo-card.
 */
export const CardMedia = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-lg border border-hairline bg-paper shadow-sm dark:border-forest-800 dark:bg-forest-900",
        className
      )}
      {...props}
    />
  )
);
CardMedia.displayName = "CardMedia";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-display text-lg font-medium leading-tight tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-ink-soft dark:text-forest-200/70", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
