/**
 * Settings service: the API calls for the application details and upload rules.
 * Plain async functions, no React. The hooks in `hooks/queries/use-settings.ts` wrap them.
 */
import { api } from '@/core/api/client';
import type { AppSettings } from '@/core/types/settings.types';

/**
 * Gets the application details and upload rules.
 * GET /settings. Public.
 */
export const getSettings = async (signal?: AbortSignal) =>
  (await api.get<AppSettings>('/settings', { signal })).data;

/**
 * Saves the application details and upload rules. Blank optional text is cleared.
 * PUT /settings. Administrators only.
 * @throws ApiError 400 when a value is out of range
 */
export const updateSettings = async (
  values: Omit<AppSettings, 'tagline' | 'logoUrl' | 'supportEmail'> & {
    tagline: string;
    logoUrl: string;
    supportEmail: string;
  },
) => (await api.put<AppSettings>('/settings', values)).data;
