import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/feedback';
import { Page } from '@/components/layout';
import { Button } from '@/components/ui';
import { MESSAGES } from '@/core/lib/messages';
import { PATHS } from '@/router/paths';

/** Not found: any route that doesn't exist. */
export default function NotFoundPage() {
  return (
    <Page title="Page not found">
      <EmptyState
        icon={SearchX}
        title="We can’t find that page"
        description={MESSAGES.generic.notFound}
        action={
          <Button asChild>
            <Link to={PATHS.learner.catalog}>Back to courses</Link>
          </Button>
        }
      />
    </Page>
  );
}
