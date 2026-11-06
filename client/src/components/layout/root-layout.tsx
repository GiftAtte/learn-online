import { BookOpen, FolderTree, GraduationCap, LayoutDashboard, Library, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import type { NavItem } from '@/core/types/ui.types';
import { Button } from '@/components/ui/button';
import { useSession, useSignOut } from '@/core/hooks/queries/use-auth';
import { PATHS } from '@/router/paths';

const catalog: NavItem = {
  to: PATHS.learner.catalog,
  label: 'Catalog',
  icon: BookOpen,
  end: true,
};

const NAV: Record<'guest' | 'learner' | 'admin', NavItem[]> = {
  guest: [catalog],
  learner: [
    catalog,
    { to: PATHS.learner.myLearning, label: 'My learning', icon: GraduationCap },
    { to: PATHS.learner.dashboard, label: 'Progress', icon: LayoutDashboard },
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

/** The app frame, with navigation that depends on who is signed in. */
export function RootLayout() {
  const { user, isAdmin } = useSession();
  const signOut = useSignOut();

  return (
    <AppShell
      nav={NAV[!user ? 'guest' : isAdmin ? 'admin' : 'learner']}
      user={
        user
          ? { name: user.name, email: user.email, roleLabel: isAdmin ? 'Administrator' : 'Learner' }
          : null
      }
      onSignOut={signOut}
      guestActions={
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={PATHS.signIn}>Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to={PATHS.signUp}>Sign up</Link>
          </Button>
        </div>
      }
    />
  );
}
