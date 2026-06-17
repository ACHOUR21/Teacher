import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils.js';

/**
 * Button variants powered by class-variance-authority.
 * Follows the EduAI design system with accessible focus rings and
 * disabled states built in.
 */
const buttonVariants = cva(
  // Base styles applied to every variant
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        /** Primary brand action — blue background. */
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        /** Destructive / danger action — red background. */
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        /** Subtle outlined button — transparent with border. */
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        /** Secondary muted action. */
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        /** Invisible background — highlighted on hover. */
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        /** Looks like a hyperlink. */
        link: 'text-primary underline-offset-4 hover:underline',
        /** Success state — green. */
        success: 'bg-green-600 text-white shadow hover:bg-green-700',
        /** Warning state — amber. */
        warning: 'bg-amber-500 text-white shadow hover:bg-amber-600',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-10 w-10',
      },
      loading: {
        true: 'cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * When true, the component renders its child element instead of a `<button>`.
   * Useful for composing with `<Link>` components.
   */
  asChild?: boolean;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /** Icon placed before the label. */
  leftIcon?: React.ReactNode;
  /** Icon placed after the label. */
  rightIcon?: React.ReactNode;
}

/**
 * Accessible, variant-aware button component.
 *
 * @example
 * ```tsx
 * <Button variant="outline" size="sm" leftIcon={<Plus />}>
 *   Add Course
 * </Button>
 *
 * <Button loading>Saving…</Button>
 *
 * <Button asChild>
 *   <Link href="/dashboard">Go to Dashboard</Link>
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      asChild = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            {children}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

// ─── Internal loading spinner ─────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export { Button, buttonVariants };
