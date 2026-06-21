import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../utils.js';
// ─── Toast Variants ───────────────────────────────────────────────────────────
const toastVariants = cva([
    'relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg',
    'pointer-events-auto',
    'transition-all duration-300',
], {
    variants: {
        type: {
            success: 'border-green-200 bg-green-50 text-green-900',
            error: 'border-red-200 bg-red-50 text-red-900',
            warning: 'border-amber-200 bg-amber-50 text-amber-900',
            info: 'border-blue-200 bg-blue-50 text-blue-900',
        },
    },
    defaultVariants: {
        type: 'info',
    },
});
/**
 * Single toast notification. Renders as a self-contained card with an icon,
 * message, optional description, and a dismiss button.
 *
 * Wire up an array of toasts at the app root — see `ToastContainer` for a
 * ready-made viewport component.
 *
 * @example
 * ```tsx
 * <Toast
 *   type="success"
 *   message="Course published!"
 *   description="Students can now enrol."
 *   duration={4000}
 *   onDismiss={() => removeToast(id)}
 * />
 * ```
 */
function Toast({ type = 'info', message, description, duration = 5000, onDismiss, className, closable = true, }) {
    // ── Auto-dismiss ───────────────────────────────────────────────────────────
    React.useEffect(() => {
        if (!duration || !onDismiss)
            {return;}
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
    }, [duration, onDismiss]);
    return (<div role="alert" aria-live="assertive" aria-atomic="true" className={cn(toastVariants({ type }), className)}>
      {/* Type icon */}
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        <ToastIcon type={type}/>
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{message}</p>
        {description && (<p className="mt-0.5 text-sm opacity-80 leading-snug">{description}</p>)}
      </div>

      {/* Dismiss button */}
      {closable && onDismiss && (<button type="button" aria-label="Dismiss notification" onClick={onDismiss} className={cn('shrink-0 rounded p-0.5', 'opacity-60 transition-opacity hover:opacity-100', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current')}>
          <CloseIcon />
        </button>)}
    </div>);
}
const positionClasses = {
    'top-left': 'top-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'top-right': 'top-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-4 right-4 items-end',
};
/**
 * Fixed viewport container that stacks `<Toast>` components.
 * Mount once near the root of your app.
 *
 * @example
 * ```tsx
 * <ToastContainer position="bottom-right">
 *   {toasts.map((t) => (
 *     <Toast key={t.id} {...t} onDismiss={() => remove(t.id)} />
 *   ))}
 * </ToastContainer>
 * ```
 */
function ToastContainer({ position = 'bottom-right', className, children, }) {
    return (<div aria-label="Notifications" className={cn('pointer-events-none fixed z-[100] flex flex-col gap-2', 'w-full max-w-sm', positionClasses[position], className)}>
      {children}
    </div>);
}
// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function ToastIcon({ type }) {
    switch (type) {
        case 'success':
            return (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-green-600">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <path d="m9 11 3 3L22 4"/>
        </svg>);
        case 'error':
            return (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-red-600">
          <circle cx="12" cy="12" r="10"/>
          <path d="m15 9-6 6"/>
          <path d="m9 9 6 6"/>
        </svg>);
        case 'warning':
            return (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-amber-600">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
        </svg>);
        case 'info':
        default:
            return (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-blue-600">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>);
    }
}
function CloseIcon() {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>);
}
export { Toast, ToastContainer, toastVariants };
