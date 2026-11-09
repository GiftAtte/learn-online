import { Menu, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { NavItem, ShellUser } from '@/core/types/ui.types';
import { SidebarMenu } from './sidebar';

interface MobileMenuProps {
  nav: NavItem[];
  footerNav?: NavItem[];
  user: ShellUser;
  onSignOut?: () => void;
}

/**
 * The phone and tablet menu for people with many destinations (administrators): a menu button in the top
 * bar opens a drawer from the left holding the same grouped menu as the desktop sidebar. It closes when
 * you pick a page, press Escape, tap outside it, or use the close button; focus stays inside while it is
 * open and returns to the menu button afterwards.
 */
export function MobileMenu({ nav, footerNav, user, onSignOut }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Whatever way the page changed (a link in the menu, the account menu, the back button), close it.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Open menu" className="-ml-1.5">
          <Menu className="size-5" aria-hidden />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-spruce-950/55 backdrop-blur-[2px] lg:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] animate-drawer flex-col bg-spruce-900 text-white shadow-overlay outline-none lg:hidden"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close menu"
              className="absolute top-3.5 right-3 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full text-spruce-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-pencil-400"
            >
              <X className="size-5" aria-hidden />
            </button>
          </Dialog.Close>
          <SidebarMenu
            nav={nav}
            footerNav={footerNav}
            user={user}
            onSignOut={onSignOut}
            onNavigate={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
