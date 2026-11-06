import { isStalePageError } from '@/core/lib/stale-page';

describe('isStalePageError', () => {
  it('recognises the errors a browser raises when a file of an older version is gone', () => {
    expect(
      isStalePageError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://example.com/assets/overview-page-abc.js',
        ),
      ),
    ).toBe(true);
    expect(isStalePageError(new TypeError('error loading dynamically imported module'))).toBe(true);
    expect(isStalePageError(new Error('Importing a module script failed.'))).toBe(true);
  });

  it('ignores ordinary errors, so they are shown instead of causing a reload', () => {
    expect(isStalePageError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isStalePageError(undefined)).toBe(false);
  });
});
