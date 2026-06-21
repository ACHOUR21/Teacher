import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../utils.js';
const inputVariants = cva([
    'flex w-full rounded-md border bg-background px-3 py-2 text-sm',
    'ring-offset-background placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-colors duration-150',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
], {
    variants: {
        inputSize: {
            sm: 'h-8 text-xs',
            default: 'h-9',
            lg: 'h-10',
            xl: 'h-12 text-base',
        },
        state: {
            default: 'border-input',
            error: 'border-destructive focus-visible:ring-destructive',
            success: 'border-green-500 focus-visible:ring-green-500',
            warning: 'border-amber-400 focus-visible:ring-amber-400',
        },
    },
    defaultVariants: {
        inputSize: 'default',
        state: 'default',
    },
});
/**
 * Flexible text input with left/right element slots.
 *
 * @example
 * ```tsx
 * // Simple
 * <Input placeholder="Enter your email" type="email" />
 *
 * // With icon prefix
 * <Input
 *   leftElement={<Search className="h-4 w-4 text-muted-foreground" />}
 *   placeholder="Search courses…"
 * />
 *
 * // Error state
 * <Input state="error" value={email} onChange={…} />
 * ```
 */
const Input = React.forwardRef(({ className, inputSize, state, leftElement, rightElement, type, ...props }, ref) => {
    // If there are no decorators, render a plain input for optimal performance.
    if (!leftElement && !rightElement) {
        return (<input type={type} className={cn(inputVariants({ inputSize, state, className }))} ref={ref} {...props}/>);
    }
    // Wrapped mode — provides left/right slots.
    return (<div className="relative flex items-center">
        {leftElement && (<span className="pointer-events-none absolute left-3 flex items-center" aria-hidden="true">
            {leftElement}
          </span>)}

        <input type={type} className={cn(inputVariants({ inputSize, state }), leftElement && 'pl-9', rightElement && 'pr-9', className)} ref={ref} {...props}/>

        {rightElement && (<span className="absolute right-3 flex items-center" aria-hidden="true">
            {rightElement}
          </span>)}
      </div>);
});
Input.displayName = 'Input';
/**
 * Password input with a built-in show/hide toggle.
 *
 * @example
 * ```tsx
 * <PasswordInput placeholder="Enter password" value={pw} onChange={…} />
 * ```
 */
const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    return (<Input ref={ref} type={show ? 'text' : 'password'} className={className} rightElement={<button type="button" tabIndex={-1} onClick={() => setShow((prev) => !prev)} className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>} {...props}/>);
});
PasswordInput.displayName = 'PasswordInput';
// ─── Minimal inline SVG icons (avoids importing lucide-react here) ────────────
function EyeIcon() {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>);
}
function EyeOffIcon() {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>);
}
export { Input, inputVariants, PasswordInput };
