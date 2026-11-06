import { useEffect } from 'react';
import { useAppSettings } from '@/core/hooks/queries/use-settings';

/** Keeps the browser tab title in step with the application name. Renders nothing. */
export function Branding() {
  const { appName } = useAppSettings();
  useEffect(() => {
    document.title = appName;
  }, [appName]);
  return null;
}
