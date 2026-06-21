import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../utils.js';
// ─── Card Root ────────────────────────────────────────────────────────────────
const cardVariants = cva('rounded-xl border bg-card text-card-foreground transition-shadow duration-200', {
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
            interactive: 'shadow-sm hover:shadow-md cursor-pointer hover:border-primary/50 hover:-translate-y-0.5',
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
});
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
const Card = React.forwardRef(({ className, variant, padding, asArticle, ...props }, ref) => (<div ref={ref} role={asArticle ? 'article' : undefined} className={cn(cardVariants({ variant, padding, className }))} {...props}/>));
Card.displayName = 'Card';
const CardHeader = React.forwardRef(({ className, withBorder = false, ...props }, ref) => (<div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', withBorder && 'border-b pb-4', className)} {...props}/>));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef(({ className, as: Heading = 'h3', ...props }, ref) => (<Heading ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props}/>));
CardTitle.displayName = 'CardTitle';
// ─── Card Description ─────────────────────────────────────────────────────────
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (<p ref={ref} className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...props}/>));
CardDescription.displayName = 'CardDescription';
// ─── Card Content ─────────────────────────────────────────────────────────────
const CardContent = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={cn('p-6 pt-0', className)} {...props}/>));
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef(({ className, withBorder = false, ...props }, ref) => (<div ref={ref} className={cn('flex items-center p-6 pt-0', withBorder && 'border-t pt-4', className)} {...props}/>));
CardFooter.displayName = 'CardFooter';
// ─── Card Badge (optional decoration) ────────────────────────────────────────
const cardBadgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors', {
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
});
const CardBadge = React.forwardRef(({ className, variant, ...props }, ref) => (<span ref={ref} className={cn(cardBadgeVariants({ variant, className }))} {...props}/>));
CardBadge.displayName = 'CardBadge';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardBadge, cardVariants, cardBadgeVariants };
