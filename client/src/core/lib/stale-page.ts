/**
 * After a new version is deployed, a page that was opened earlier still points at the old file names
 * (for example `overview-page-abc123.js`). Those files are gone, so opening a new screen fails with
 * "Failed to fetch dynamically imported module". The cure is simply to load the page again.
 */

const RELOADED_AT = 'learnonline.reloaded-at';

/** True when the error means "a file of an older version of the app no longer exists". */
export const isStalePageError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /dynamically imported module|importing a module script failed|error loading dynamically imported module/i.test(
    message,
  );
};

/**
 * Loads the page again, but at most once every 10 seconds, so a real outage can never cause an endless
 * reload loop. Returns false when it chose not to reload.
 */
export const reloadOnce = () => {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT) ?? 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {
    // Storage can be blocked (private windows); reloading once more is still better than a broken page.
  }
  window.location.reload();
  return true;
};
