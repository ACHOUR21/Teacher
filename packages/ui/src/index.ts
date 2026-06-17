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

// ─── Feedback & Status ────────────────────────────────────────────────────────
export { Badge, badgeVariants } from './components/Badge.js';
export type { BadgeProps } from './components/Badge.js';

export { Spinner, spinnerVariants } from './components/Spinner.js';
export type { SpinnerProps } from './components/Spinner.js';

export { Toast, ToastContainer, toastVariants } from './components/Toast.js';
export type { ToastProps, ToastContainerProps } from './components/Toast.js';

// ─── Data Display ─────────────────────────────────────────────────────────────
export { Avatar, avatarSizeVariants, getInitials, getColourClass } from './components/Avatar.js';
export type { AvatarProps } from './components/Avatar.js';

export { Table } from './components/Table.js';
export type { TableProps, TableColumn } from './components/Table.js';

export { Tabs } from './components/Tabs.js';
export type { TabsProps, TabItem } from './components/Tabs.js';

// ─── Form Controls ────────────────────────────────────────────────────────────
export { Select } from './components/Select.js';
export type { SelectProps, SelectOption } from './components/Select.js';

// ─── Overlay ──────────────────────────────────────────────────────────────────
export { Modal, modalPanelVariants } from './components/Modal.js';
export type { ModalProps } from './components/Modal.js';
