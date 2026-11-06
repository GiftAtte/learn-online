import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { ConfirmProvider } from '@/components/feedback/confirm-dialog';
import { Toaster } from '@/components/feedback/toaster';
import { Branding } from '@/components/layout/branding';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryKeys } from '@/core/hooks/queries/query-keys';
import { setUnauthorizedHandler } from '@/core/api/client';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import { queryClient } from '@/core/lib/query-client';

/** Everything the app needs around the router, in one place. */
export function AppProviders({ children }: { children: ReactNode }) {
  // When the server says the session has ended, sign the person out once and say why.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!queryClient.getQueryData(queryKeys.me)) return; // already signed out
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== queryKeys.me[0] });
      queryClient.setQueryData(queryKeys.me, null);
      notify.info(MESSAGES.auth.sessionExpired, { id: 'session-expired' });
    });
    return () => setUnauthorizedHandler(undefined);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConfirmProvider>
          <Branding />
          {children}
          <Toaster />
        </ConfirmProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
