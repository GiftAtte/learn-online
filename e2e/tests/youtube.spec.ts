import { expect, test, type Page } from '@playwright/test';

const ADMIN = { email: 'admin@learnonline.dev', password: 'Admin123!' };
const VIDEO_ID = 'dQw4w9WgXcQ';
const PREFIX = 'YouTube e2e';
const TITLE = `${PREFIX} ${Date.now()}`;

const signIn = async (page: Page) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/admin');
};

/** The seeded draft course keeps this test away from real learners. */
const openDraftCourse = async (page: Page) => {
  await page.goto('/admin/courses');
  await page.getByRole('link', { name: /Data Storytelling/ }).first().click();
  await expect(page.getByRole('button', { name: 'Add lesson' }).first()).toBeVisible();
};

/** Deletes every lesson this test has created (also clears leftovers from an interrupted run). */
const removeTestLessons = async (page: Page) => {
  const rows = page.getByRole('table').getByRole('row').filter({ hasText: PREFIX });
  while ((await rows.count()) > 0) {
    const title = (await rows.first().locator('span.truncate.font-semibold').first().textContent()) ?? '';
    await page.getByRole('button', { name: `Actions for ${title}` }).click();
    await page.getByRole('menuitem', { name: 'Delete lesson' }).click();
    await page.getByRole('button', { name: 'Delete lesson' }).click();
    await expect(page.getByRole('table').getByText(title)).toHaveCount(0);
  }
};

test('an administrator adds a lesson by YouTube ID and it plays in YouTube’s player', async ({
  page,
}) => {
  await signIn(page);
  await openDraftCourse(page);
  await removeTestLessons(page);

  try {
    await page.getByRole('button', { name: 'Add lesson' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/^Title/).fill(TITLE);
    await dialog.getByLabel(/^Description/).fill('A lesson hosted on YouTube.');
    await dialog.getByRole('radio', { name: 'YouTube' }).click();
    await dialog.getByPlaceholder(/video id or link/i).fill(`https://youtu.be/${VIDEO_ID}`);

    // The preview confirms which video it is, even before YouTube has told us the length.
    await expect(dialog.getByText(`YouTube video ${VIDEO_ID}`)).toBeVisible();
    // If YouTube could not be reached to read the length, type it in so the lesson can still be saved.
    const length = dialog.getByLabel(/Video length/);
    await expect(async () => {
      if (!(await length.inputValue())) await length.fill('212');
      expect(await length.inputValue()).not.toBe('');
    }).toPass({ timeout: 15_000 });

    await dialog.getByRole('button', { name: 'Add lesson' }).click();
    await expect(page.getByRole('table').getByText(TITLE)).toBeVisible();

    // Preview it: the player is YouTube's embed, not a <video>.
    await page.getByRole('button', { name: `Actions for ${TITLE}` }).click();
    await page.getByRole('menuitem', { name: 'Preview' }).click();
    await expect(page).toHaveURL(/\/learner\/lessons\//);
    await expect(
      page.locator(`iframe[src*="youtube-nocookie.com/embed/${VIDEO_ID}"]`),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('video')).toHaveCount(0);
  } finally {
    // Tidy up even if something above failed.
    await openDraftCourse(page);
    await removeTestLessons(page);
  }
});
