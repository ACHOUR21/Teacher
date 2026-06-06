import * as React from 'react';

import { cn } from '../utils.js';

// ─── Option type ──────────────────────────────────────────────────────────────

export interface SelectOption {
  /** Submitted form value. */
  value: string;
  /** Human-readable label shown in the dropdown. */
  label: string;
  /** When true, the option is non-interactive. */
  disabled?: boolean;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'size'> {
  /** Array of options to render. */
  options: SelectOption[];
  /** Placeholder text shown when no value is selected. */
  placeholder?: string;
  /** Current selected value (controlled). */
  value?: string;
  /** Default selected value (uncontrolled). */
  defaultValue?: string;
  /** Called when the selection changes. Receives the raw string value. */
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Makes the select non-interactive. */
  disabled?: boolean;
  /** Additional class names applied to the `<select>` element. */
  className?: string;
  /** Accessible label when no visible `<label>` is present. */
  'aria-label'?: string;
}

/**
 * Native `<select>` element styled to match the EduAI design system.
 *
 * Uses the browser's native dropdown for maximum accessibility and zero
 * JavaScript overhead. Pair with `<label>` for best accessibility.
 *
 * @example
 * ```tsx
 * <Select
 *   options={[
 *     { value: 'math', label: 'Mathematics' },
 *     { value: 'sci', label: 'Science' },
 *   ]}
 *   placeholder="Select subject"
 *   value={subject}
 *   onChange={(e) => setSubject(e.target.value)}
 * />
 * ```
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      placeholder,
      value,
      defaultValue,
      onChange,
      disabled = false,
      ...props
    },
    ref,
  ) => (
    <div className="relative inline-block w-full">
      <select
        ref={ref}
        value={value}
        defaultValue={defaultValue ?? (placeholder ? '' : undefined)}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          // Base
          'flex h-9 w-full appearance-none rounded-md border border-input bg-background',
          'px-3 py-2 pr-8 text-sm',
          'ring-offset-background',
          // Placeholder colour handled via CSS custom property trick:
          // when the empty sentinel option is selected, text is muted.
          'text-foreground',
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-150',
          className,
        )}
        {...props}
      >
        {/* Placeholder sentinel — excluded from valid submissions */}
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}

        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom chevron icon */}
      <ChevronDownIcon />
    </div>
  ),
);
Select.displayName = 'Select';

// ─── Inline chevron (no external icon lib dependency) ─────────────────────────

function ChevronDownIcon() {
  return (
    <span
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

export { Select };
