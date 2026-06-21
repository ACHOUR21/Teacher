import * as React from 'react';

import { cn } from '@/lib/utils';
const Input = React.forwardRef(({ className, type, label, error, hint, leftIcon, rightIcon, ...props }, ref) => {
    const id = props.id || props.name;
    return (<div className="w-full">
        {label && (<label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
            {props.required && (<span className="text-destructive ml-1">*</span>)}
          </label>)}
        <div className="relative">
          {leftIcon && (<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>)}
          <input type={type} className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background', 'file:border-0 file:bg-transparent file:text-sm file:font-medium', 'placeholder:text-muted-foreground', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'disabled:cursor-not-allowed disabled:opacity-50', 'transition-colors', error && 'border-destructive focus-visible:ring-destructive', leftIcon && 'pl-10', rightIcon && 'pr-10', className)} ref={ref} id={id} {...props}/>
          {rightIcon && (<div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>)}
        </div>
        {error && (<p className="mt-1.5 text-xs text-destructive">{error}</p>)}
        {hint && !error && (<p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>)}
      </div>);
});
Input.displayName = 'Input';
export { Input };
