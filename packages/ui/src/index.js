/**
 * @eduai/ui — Public Component Library
 *
 * Export every component and utility from this package.
 * Consumers import directly: `import { Button } from '@eduai/ui'`
 */
// ─── Utility ──────────────────────────────────────────────────────────────────
export { cn } from './utils.js';
// ─── Primitives ───────────────────────────────────────────────────────────────
export { Button, buttonVariants } from './components/Button.jsx';
export { Input, inputVariants, PasswordInput } from './components/Input.jsx';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardBadge, cardVariants, cardBadgeVariants, } from './components/Card.jsx';
// ─── Feedback & Status ────────────────────────────────────────────────────────
export { Badge, badgeVariants } from './components/Badge.jsx';
export { Spinner, spinnerVariants } from './components/Spinner.jsx';
export { Toast, ToastContainer, toastVariants } from './components/Toast.jsx';
// ─── Data Display ─────────────────────────────────────────────────────────────
export { Avatar, avatarSizeVariants, getInitials, getColourClass } from './components/Avatar.jsx';
export { Table } from './components/Table.jsx';
export { Tabs } from './components/Tabs.jsx';
// ─── Form Controls ────────────────────────────────────────────────────────────
export { Select } from './components/Select.jsx';
// ─── Overlay ──────────────────────────────────────────────────────────────────
export { Modal, modalPanelVariants } from './components/Modal.jsx';
