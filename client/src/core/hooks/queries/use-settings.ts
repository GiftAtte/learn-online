import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '@/core/lib/notify';
import * as settingsService from '@/core/services/settings.service';
import type { AppSettings } from '@/core/types/settings.types';
import { queryKeys } from './query-keys';

/** What the app shows until the saved details arrive (and if they can't be loaded). */
export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'LearnOnline',
  tagline: null,
  logoUrl: null,
  supportEmail: null,
  imageMaxMegabytes: 10,
  videoMaxMegabytes: 100,
  imageFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  videoFormats: ['mp4', 'webm', 'mov'],
  allowSignups: true,
};

/** Loads the application details. */
export const useGetSettings = () =>
  useQuery({
    queryKey: queryKeys.settings,
    staleTime: 5 * 60_000,
    queryFn: ({ signal }) => settingsService.getSettings(signal),
  });

/** The application details, falling back to the defaults while loading, so the name and logo never flash empty. */
export const useAppSettings = (): AppSettings => useGetSettings().data ?? DEFAULT_SETTINGS;

/** Saves the application details and updates every place that shows the name or logo. Form errors are left for the form to show. */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsService.updateSettings,
    meta: { handlesOwnError: true },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.settings, saved);
      notify.success('Settings saved');
    },
  });
};
