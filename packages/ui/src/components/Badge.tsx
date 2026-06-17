import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils.js';

// ─── Badge Variants ───────────────────────────────────────────────────────────

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center rounded-full border font-semibold',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        /** Primary brand badge. */
        default: 'border-transparent bg-primary text-primary-foreground',
        /** Positive / completed state — green. */
        success: 'border-transparent bg-green-100 text-green-800',
        /** Caution state — amber. */
        warning: 'border-transparent bg-amber-100 text-amber-800',
        /** Error / blocked state — red. */
        danger: 'border-transparent bg-red-100 text-red-800',
        /** Informational state — blue. */
        info: 'border-transparent bg-blue-100 text-blue-800',
        /** Muted secondary badge — grey. */
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        /** Outlined badge — no background fill. */
        outline: 'text-foreground',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional leading dot indicator matching the variant colour. */
  withDot?: boolean;
}

/**
 * Compact status / label badge.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger" size="sm">Overdue</Badge>
 * <Badge variant="info" withDot>In Progress</Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, withDot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {withDot && (
        <span
          className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full', dotColour(variant))}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  ),
);
Badge.displayName = 'Badge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dotColour(variant: BadgeProps['variant']): string {
  const map: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-primary-foreground/70',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    secondary: 'bg-muted-foreground',
    outline: 'bg-foreground',
  };
  return map[variant ?? 'default'] ?? 'bg-current';
}

export { Badge, badgeVariants };
