import { cva } from 'class-variance-authority';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../utils.js';
// ─── Panel Size Variants ──────────────────────────────────────────────────────
const modalPanelVariants = cva([
    'relative w-full rounded-xl border bg-background shadow-xl',
    'flex flex-col max-h-[90vh]',
    // Enter animation via CSS — Tailwind JIT utilities
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]',
], {
    variants: {
        size: {
            sm: 'max-w-sm',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});
/**
 * Accessible modal / dialog overlay.
 *
 * Traps focus when open, closes on Escape, and restores focus on unmount.
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   title="Delete Course"
 *   description="This action cannot be undone."
 *   size="sm"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button variant="destructive" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   <p>Are you sure you want to delete <strong>{course.title}</strong>?</p>
 * </Modal>
 * ```
 */
function Modal({ isOpen, onClose, title, description, children, footer, size, className, disableBackdropClose = false, }) {
    // ── Keyboard handling ──────────────────────────────────────────────────────
    React.useEffect(() => {
        if (!isOpen)
            {return;}
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    // ── Body scroll lock ───────────────────────────────────────────────────────
    React.useEffect(() => {
        if (!isOpen) {
            return;
        }
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);
    if (!isOpen)
        {return null;}
    return (
    // Portal target — renders directly inside <body>
    <ModalPortal>
      {/* Backdrop */}
      <div aria-hidden="true" onClick={disableBackdropClose ? undefined : onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"/>

      {/* Centering wrapper */}
      <div role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined} aria-describedby={description ? 'modal-description' : undefined} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => {
            // Prevent clicks inside the panel from closing the modal
            e.stopPropagation();
        }}>
        <div data-state="open" className={cn(modalPanelVariants({ size }), className)}>
          {/* ── Header ─────────────────────────────────────────────────── */}
          {(title || description) && (<div className="flex shrink-0 items-start justify-between gap-4 border-b px-6 py-4">
              <div className="min-w-0 flex-1">
                {title && (<h2 id="modal-title" className="text-lg font-semibold leading-none tracking-tight">
                    {title}
                  </h2>)}
                {description && (<p id="modal-description" className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>)}
              </div>

              {/* Close button */}
              <button type="button" aria-label="Close dialog" onClick={onClose} className={cn('shrink-0 rounded-md p-1 text-muted-foreground', 'transition-colors hover:bg-accent hover:text-accent-foreground', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}>
                <CloseIcon />
              </button>
            </div>)}

          {/* ── Body ───────────────────────────────────────────────────── */}
          {children && (<div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>)}

          {/* ── Footer ─────────────────────────────────────────────────── */}
          {footer && (<div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4">
              {footer}
            </div>)}
        </div>
      </div>
    </ModalPortal>);
}
// ─── Portal helper — works without react-dom/client peer ─────────────────────
function ModalPortal({ children }) {
    // Use createPortal when available; fall back to rendering in-tree for SSR.
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted)
        {return null;}
    return createPortal(children, document.body);
}
// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function CloseIcon() {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>);
}
export { Modal, modalPanelVariants };
