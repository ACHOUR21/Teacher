import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils.js';

// ─── Size Map ─────────────────────────────────────────────────────────────────

const avatarSizeVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

// ─── Deterministic colour palette (based on first char of name) ───────────────

const PALETTE = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-600',
  'bg-green-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-sky-500',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-purple-600',
  'bg-fuchsia-600',
  'bg-pink-600',
  'bg-rose-600',
];

function getColourClass(name: string): string {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return PALETTE[code % PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Online indicator size ────────────────────────────────────────────────────

const indicatorSizeMap: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-1.5 w-1.5 ring-1',
  sm: 'h-2 w-2 ring-1',
  md: 'h-2.5 w-2.5 ring-2',
  lg: 'h-3 w-3 ring-2',
  xl: 'h-3.5 w-3.5 ring-2',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AvatarProps extends VariantProps<typeof avatarSizeVariants> {
  /** Image source URL. Falls back to initials when omitted or load fails. */
  src?: string;
  /**
   * Full name of the person. Used to derive initials and a deterministic
   * background colour when no image is provided. Required.
   */
  name: string;
  /** Show a green online indicator badge in the bottom-right corner. */
  online?: boolean;
  /** Custom class applied to the outermost wrapper. */
  className?: string;
  /** Alt text for the image. Defaults to the name prop. */
  alt?: string;
}

/**
 * Avatar with automatic initials fallback, deterministic colour, and optional
 * online status indicator.
 *
 * @example
 * ```tsx
 * <Avatar name="Ada Lovelace" size="lg" online />
 * <Avatar name="John Doe" src="/avatars/john.png" size="sm" />
 * ```
 */
function Avatar({ src, name, size = 'md', online = false, className, alt }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const showImage = Boolean(src) && !imgError;
  const colourClass = getColourClass(name);
  const initials = getInitials(name);

  return (
    <span className={cn('relative inline-block shrink-0', className)}>
      <span className={cn(avatarSizeVariants({ size }), !showImage && colourClass)}>
        {showImage ? (
          <img
            src={src}
            alt={alt ?? name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            aria-label={alt ?? name}
            className="font-semibold text-white leading-none"
          >
            {initials}
          </span>
        )}
      </span>

      {online && (
        <span
          aria-label="Online"
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-green-500 ring-white',
            indicatorSizeMap[size ?? 'md'],
          )}
        />
      )}
    </span>
  );
}

export { Avatar, avatarSizeVariants, getInitials, getColourClass };
