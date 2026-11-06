/** Shapes shared by the reusable UI components in `components/` (menus, selects, navigation, dialogs). */
import type { LucideIcon } from 'lucide-react';

/** One choice in a filter-chip group. */
export interface ChipOption {
  value: string;
  label: string;
}

/** One choice in a select or dropdown. */
export interface SelectOption {
  value: string;
  label: string;
}

/** One entry in the "⋯" menu at the end of a table row. */
export interface RowAction {
  label: string;
  icon: LucideIcon;
  /** Runs when chosen. Use `to` instead for navigation. */
  onSelect?: () => void;
  to?: string;
  tone?: 'danger';
  /** Draws a divider above this action (used to set delete apart). */
  separated?: boolean;
}

/** The colour of a stat tile's icon: soft tint, strong glyph. */
export type StatTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

/** One destination in the sidebar, the top bar or the phone tab bar. */
export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact path (for "/" style links). */
  end?: boolean;
  /** Sidebar only: draws a divider above this item to set it apart from the main group. */
  separated?: boolean;
}

/** The signed-in person shown in the shell. */
export interface ShellUser {
  name: string;
  email: string;
  roleLabel?: string;
}

/** What a confirmation dialog shows. */
export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions such as deleting. */
  tone?: 'primary' | 'danger';
}

/** Opens a confirmation dialog and resolves to whether the person confirmed. */
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

/** What a form field shares with the control inside it, so label, hint and error stay connected. */
export interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}
