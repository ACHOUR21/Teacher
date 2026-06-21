import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../utils.js';
// ─── Spinner Variants ─────────────────────────────────────────────────────────
const spinnerVariants = cva('animate-spin', {
    variants: {
        size: {
            sm: 'h-4 w-4',
            md: 'h-6 w-6',
            lg: 'h-8 w-8',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});
/**
 * Animated loading spinner.
 *
 * Colour is controlled via `className` (e.g. `text-primary`, `text-white`).
 * Defaults to `currentColor` so it inherits from surrounding text colour.
 *
 * @example
 * ```tsx
 * <Spinner size="sm" className="text-primary" />
 * <Spinner size="lg" label="Saving changes…" />
 * ```
 */
const Spinner = React.forwardRef(({ className, size, label = 'Loading…', ...props }, ref) => (<>
      <svg ref={ref} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true" className={cn(spinnerVariants({ size }), className)} {...props}>
        {/* Track */}
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        {/* Spinner head */}
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {/* Accessible label for screen readers */}
      <span className="sr-only">{label}</span>
    </>));
Spinner.displayName = 'Spinner';
export { Spinner, spinnerVariants };
