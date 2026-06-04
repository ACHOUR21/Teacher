import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils.js';

// ─── Card Root ────────────────────────────────────────────────────────────────

const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground transition-shadow duration-200',
  {
    variants: {
      variant: {
        /** Standard card with subtle shadow. */
        default: 'shadow-sm',
        /** Elevated card — stronger shadow, white background. */
        elevated: 'shadow-md',
        /** Outlined card — no shadow, visible border only. */
        outlined: 'shadow-none border-2',
        /** Ghost card — no border and no shadow. */
        ghost: 'border-transparent shadow-none bg-transparent',
        /** Interactive card — deepens shadow on hover, shows pointer cursor. */
        interactive:
          'shadow-sm hover:shadow-md cursor-pointer hover:border-primary/50 hover:-translate-y-0.5',
      },
      padding: {
        none: '',
        sm: 'p-3',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'none',
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** When true, adds `role="article"` for semantic meaning. */
  asArticle?: boolean;
}

/**
 * Base card container.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Course Title</CardTitle>
 *     <CardDescription>Learn React from scratch.</CardDescription>
 *   </CardHeader>
 *   <CardContent>…</CardContent>
 *   <CardFooter>
 *     <Button>Enrol Now</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, asArticle, ...props }, ref) => (
    <div
      ref={ref}
      role={asArticle ? 'article' : undefined}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

// ─── Card Header ──────────────────────────────────────────────────────────────

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders a separator line below the header. */
  withBorder?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, withBorder = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 p-6',
        withBorder && 'border-b pb-4',
        className,
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

// ─── Card Title ───────────────────────────────────────────────────────────────

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level for semantic HTML. Defaults to h3. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Heading = 'h3', ...props }, ref) => (
    <Heading
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

// ─── Card Description ─────────────────────────────────────────────────────────

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// ─── Card Content ─────────────────────────────────────────────────────────────

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

// ─── Card Footer ─────────────────────────────────────────────────────────────

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders a separator line above the footer. */
  withBorder?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, withBorder = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-6 pt-0',
        withBorder && 'border-t pt-4',
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

// ─── Card Badge (optional decoration) ────────────────────────────────────────

const cardBadgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-100 text-green-800',
        warning: 'border-transparent bg-amber-100 text-amber-800',
        info: 'border-transparent bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface CardBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof cardBadgeVariants> {}

const CardBadge = React.forwardRef<HTMLSpanElement, CardBadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(cardBadgeVariants({ variant, className }))} {...props} />
  ),
);
CardBadge.displayName = 'CardBadge';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardBadge, cardVariants, cardBadgeVariants };
