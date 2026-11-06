import { expect, test, type Page } from '@playwright/test';

const unique = `e2e${Date.now()}`;
const learner = {
  name: 'E2E Learner',
  email: `${unique}@example.com`,
  password: 'Passw0rd123',
};

const signIn = async (page: Page, email: string, password: string, home = '/learner/catalog') => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(home);
};

test.describe.serial('learner journey', () => {
  test('signs up, enrolls, finishes a lesson and sees it on the dashboard', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Full name').fill(learner.name);
    await page.getByLabel('Email').fill(learner.email);
    await page.getByLabel('Password').fill(learner.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL('/learner/catalog');

    // Catalog -> course -> enroll
    await page.getByRole('link', { name: 'Design Thinking Essentials' }).first().click();
    await page.getByRole('button', { name: 'Enroll in this course' }).click();
    await page.getByRole('link', { name: 'Start course' }).click();

    // Lesson page shows the player; finish the video (jsdom-free: fire the native `ended` event).
    await expect(page.getByRole('group', { name: /video player/i })).toBeVisible();
    await page.locator('video').evaluate((video) => video.dispatchEvent(new Event('ended')));
    await expect(page.getByText('Completed').first()).toBeVisible();

    // Progress persisted and is reflected on the dashboard.
    await page.goto('/learner/dashboard');
    await expect(page.getByText('Design Thinking Essentials').first()).toBeVisible();
    await expect(page.getByText(/[1-9]\d*%/).first()).toBeVisible();
  });

  test('a learner cannot open the admin area', async ({ page }) => {
    await signIn(page, learner.email, learner.password);
    await page.goto('/admin/learners');
    await expect(page.getByRole('heading', { name: 'Learners' })).toHaveCount(0);
  });

  test('an administrator finds the new learner and sees their lesson progress', async ({
    page,
  }) => {
    // Administrators land on their dashboard, not on the learner catalog.
    await signIn(page, 'admin@learnonline.dev', 'Admin123!', '/admin');
    await page.goto('/admin/learners');
    await page
      .getByRole('searchbox')
      .or(page.getByRole('textbox', { name: /search/i }))
      .first()
      .fill(unique);
    await page.getByRole('link', { name: learner.name }).first().click();
    await expect(page.getByRole('heading', { name: learner.name })).toBeVisible();
    await expect(page.getByText('Design Thinking Essentials').first()).toBeVisible();
    await expect(page.getByText('Completed').first()).toBeVisible();
  });
});

test('guests are sent to sign in from protected pages', async ({ page }) => {
  await page.goto('/learner/dashboard');
  await expect(page).toHaveURL(/sign-in/);
});

test('the bare address shows the landing page, with a way to sign up and to browse', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Video courses you can actually finish',
  );
  await page.getByRole('link', { name: 'Browse courses' }).first().click();
  await expect(page).toHaveURL('/catalog');
});
