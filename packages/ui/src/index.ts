/**
 * @eduai/ui — Public Component Library
 *
 * Export every component and utility from this package.
 * Consumers import directly: `import { Button } from '@eduai/ui'`
 */

// ─── Utility ──────────────────────────────────────────────────────────────────
export { cn } from './utils.js';

// ─── Primitives ───────────────────────────────────────────────────────────────
export { Button, buttonVariants } from './components/Button.js';
export type { ButtonProps } from './components/Button.js';

export { Input, inputVariants, PasswordInput } from './components/Input.js';
export type { InputProps, PasswordInputProps } from './components/Input.js';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardBadge,
  cardVariants,
  cardBadgeVariants,
} from './components/Card.js';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardFooterProps,
  CardBadgeProps,
} from './components/Card.js';
