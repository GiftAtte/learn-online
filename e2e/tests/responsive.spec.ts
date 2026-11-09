import { expect, test, type Page } from "@playwright/test";

/**
 * The interface is built mobile first: the root font size grows smoothly with the screen (about 15px on a
 * small phone up to 17px on a desktop), and controls are more compact on a phone. These checks keep that
 * from silently disappearing.
 */

const rootFontSize = (page: Page) =>
  page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize),
  );

const height = async (page: Page, selector: string) =>
  Math.round((await page.locator(selector).first().boundingBox())!.height);

test("text and controls scale with the screen, smoothly", async ({ page }) => {
  const sizes: Record<number, number> = {};
  for (const width of [360, 600, 768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/sign-in");
    sizes[width] = await rootFontSize(page);
  }

  expect(sizes[360]).toBeCloseTo(15, 0);
  expect(sizes[1280]).toBeCloseTo(17, 0);
  // It never shrinks as the screen gets wider, and it stops growing on large desktops.
  const widths = Object.keys(sizes).map(Number);
  widths
    .slice(1)
    .forEach((w, i) =>
      expect(sizes[w]!).toBeGreaterThanOrEqual(sizes[widths[i]!]!),
    );
  expect(sizes[1920]).toBe(sizes[1280]);
  // And in between it really is fluid, not one jump.
  expect(sizes[600]).toBeGreaterThan(sizes[360]!);
  expect(sizes[768]).toBeGreaterThan(sizes[600]!);
});

test("buttons and fields are smaller on a phone than on a desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/sign-in");
  const phone = {
    button: await height(page, "form button[type=submit]"),
    field: await height(page, "form input"),
  };

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/sign-in");
  const desktop = {
    button: await height(page, "form button[type=submit]"),
    field: await height(page, "form input"),
  };

  expect(phone.button).toBeLessThan(desktop.button);
  expect(phone.field).toBeLessThan(desktop.field);
  // Still comfortable to tap.
  expect(phone.button).toBeGreaterThanOrEqual(36);
  expect(phone.field).toBeGreaterThanOrEqual(36);
});

test("headings are smaller on a phone", async ({ page }) => {
  const heading = (width: number) =>
    page.setViewportSize({ width, height: 800 }).then(async () => {
      await page.goto("/catalog");
      const h1 = page.getByRole("heading", { level: 1 });
      await h1.waitFor();
      return h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    });
  const phone = await heading(375);
  const desktop = await heading(1280);
  expect(phone).toBeLessThan(desktop);
});

test("a page's create button is on the right on a phone, as it is on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("admin@learnonline.dev");
  await page.getByLabel("Password", { exact: true }).fill("Admin123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/admin");

  await page.goto("/admin/courses");
  const button = page.getByRole("button", { name: "New course" });
  await expect(button).toBeVisible();
  const box = (await button.boundingBox())!;
  // Flush with the right-hand page margin (the page has a margin of about 16px), not tucked under the title.
  expect(375 - (box.x + box.width)).toBeLessThanOrEqual(24);
  expect(box.x).toBeGreaterThan(375 / 2 - box.width);
});
