import { Eye, EyeOff, Lock, type LucideIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { Input } from './input';

interface PasswordInputProps extends Omit<ComponentProps<typeof Input>, 'type' | 'trailing'> {
  /** The leading icon. A padlock by default. */
  icon?: LucideIcon;
}

/**
 * A password field with a padlock and an eye button that shows or hides what was typed.
 * It starts hidden. The button is a real button (keyboard and screen-reader friendly) that says what
 * it will do and whether the password is currently showing.
 */
export function PasswordInput({ icon = Lock, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Toggle = visible ? EyeOff : Eye;
  return (
    <Input
      {...props}
      icon={icon}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1"
        >
          <Toggle className="size-[1.15rem]" strokeWidth={1.8} aria-hidden />
        </button>
      }
    />
  );
}
