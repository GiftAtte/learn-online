import type { AppSettings } from '@prisma/client';
import { prisma } from '../../db/prisma';
import type { UpdateSettingsInput } from './settings.schemas';

const ID = 'app';

const toPublic = (s: AppSettings) => ({
  appName: s.appName,
  tagline: s.tagline,
  logoUrl: s.logoUrl,
  supportEmail: s.supportEmail,
  imageMaxMegabytes: s.imageMaxMegabytes,
  videoMaxMegabytes: s.videoMaxMegabytes,
  imageFormats: s.imageFormats,
  videoFormats: s.videoFormats,
  allowSignups: s.allowSignups,
});

/** The application details. The row is created with defaults the first time anyone asks. */
export const getSettings = async () =>
  toPublic(await prisma.appSettings.upsert({ where: { id: ID }, update: {}, create: { id: ID } }));

export const updateSettings = async (input: UpdateSettingsInput) =>
  toPublic(
    await prisma.appSettings.upsert({ where: { id: ID }, update: input, create: { id: ID, ...input } }),
  );
