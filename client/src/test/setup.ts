import '@testing-library/jest-dom/vitest';

// Components read the application name, logo and upload rules from the settings. Tests render them
// without a query client, so give them the defaults instead of fetching.
vi.mock('@/core/hooks/queries/use-settings', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/core/hooks/queries/use-settings')>();
  return { ...original, useAppSettings: () => original.DEFAULT_SETTINGS };
});

// jsdom has no ResizeObserver, which Radix controls (checkboxes, menus) use to measure themselves.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
