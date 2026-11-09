import {
  BookOpen,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  Library,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PublicLayout } from '@/components/layout/public-layout';
import type { NavItem } from '@/core/types/ui.types';
import { useSession, useSignOut } from '@/core/hooks/queries/use-auth';
import { PATHS } from '@/router/paths';

const catalog: NavItem = {
  to: PATHS.learner.catalog,
  label: 'Catalog',
  icon: BookOpen,
  end: true,
};

/** Pinned to the bottom of the sidebar, above the account. */
const FOOTER_NAV: Record<'learner' | 'admin', NavItem[]> = {
  learner: [],
  admin: [{ to: PATHS.admin.settings, label: 'Settings', icon: Settings }],
};

const NAV: Record<'learner' | 'admin', NavItem[]> = {
  learner: [
    catalog,
    { to: PATHS.learner.myLearning, label: 'My learning', icon: GraduationCap },
    { to: PATHS.learner.progress, label: 'Progress', icon: TrendingUp },
  ],
  admin: [
    { to: PATHS.admin.overview, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: PATHS.admin.courses, label: 'Courses', icon: Library },
    { to: PATHS.admin.categories, label: 'Categories', icon: FolderTree },
    { to: PATHS.admin.learners, label: 'Learners', icon: Users },
    // Set apart in the sidebar: it leaves the management area to see what learners see.
    { ...catalog, label: 'View catalog', separated: true },
  ],
};

/**
 * The frame around every page that is not the landing page:
 *  - signed out: the public frame (same header and footer as the landing page)
 *  - signed in: the app frame (sidebar, and the avatar that opens your profile), with navigation that depends on the role
 */
export function RootLayout() {
  const { user, isAdmin } = useSession();
  const signOut = useSignOut();

  if (!user) return <PublicLayout />;

  return (
    <AppShell
      nav={NAV[isAdmin ? 'admin' : 'learner']}
      footerNav={FOOTER_NAV[isAdmin ? 'admin' : 'learner']}
      user={{
        name: user.name,
        email: user.email,
        roleLabel: isAdmin ? 'Administrator' : 'Learner',
      }}
      onSignOut={signOut}
    />
  );
}
