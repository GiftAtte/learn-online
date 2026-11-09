import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Automated accessibility check (axe-core, WCAG 2.0/2.1 A and AA rules) of the main screens, on a desktop
 * and on a phone. It fails on any violation, so new screens must keep passing. Automated checks find
 * about a third of accessibility problems (contrast, missing names, bad roles); they do not replace
 * trying the app with a keyboard and a screen reader.
 */

const ADMIN = { email: "admin@learnonline.dev", password: "Admin123!" };
const LEARNER = { email: "learner@learnonline.dev", password: "Learner123!" };

const signIn = async (page: Page, who: { email: string; password: string }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password", { exact: true }).fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/sign-in/);
};

/** Scans one page and lists what is wrong with it, one entry per problem (empty when it is fine). */
const scan = async (page: Page, path: string): Promise<string[]> => {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  // Let skeletons give way to content and entrance animations finish.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.waitForTimeout(800);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return violations.map(
    (v) =>
      `${path}  ${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes
        .slice(0, 3)
        .map((n) => `      ${n.target.join(" ")}`)
        .join("\n"),
  );
};

/** Scans every page, then fails once with everything that was found. */
const scanAll = async (page: Page, paths: string[]) => {
  const found: string[] = [];
  for (const path of paths) found.push(...(await scan(page, path)));
  expect(found.join("\n")).toBe("");
};

// Each test scans several pages one after another.
test.setTimeout(180_000);

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 375, height: 740 },
];

for (const { name, width, height } of viewports) {
  test.describe(`accessibility on ${name}`, () => {
    test.use({ viewport: { width, height } });

    test("visitor pages", async ({ page }) => {
      await scanAll(page, ["/", "/catalog", "/sign-in", "/sign-up"]);
    });

    test("learner pages", async ({ page }) => {
      await signIn(page, LEARNER);
      const courses = await page.request.get(
        "/api/v1/courses?q=TypeScript+for+Professionals",
      );
      const courseId = (await courses.json()).data[0].id;
      const course = (
        await (await page.request.get(`/api/v1/courses/${courseId}`)).json()
      ).data;
      const lessonId = course.lessons[0].id;
      await scanAll(page, [
        "/learner/catalog",
        `/learner/courses/${courseId}`,
        `/learner/lessons/${lessonId}`,
        "/learner/my-learning",
        "/learner/progress",
        "/profile",
      ]);
    });

    test("administrator pages", async ({ page }) => {
      await signIn(page, ADMIN);
      const courses = await page.request.get(
        "/api/v1/courses?q=TypeScript+for+Professionals",
      );
      const courseId = (await courses.json()).data[0].id;
      const learners = await page.request.get(
        "/api/v1/dashboard/admin/learners?q=learner%40learnonline.dev",
      );
      const learnerId = (await learners.json()).data[0].id;
      await scanAll(page, [
        "/admin",
        "/admin/courses",
        "/admin/lessons",
        `/admin/courses/${courseId}`,
        `/admin/courses/${courseId}/activity`,
        "/admin/categories",
        "/admin/learners",
        `/admin/learners/${learnerId}`,
        "/admin/settings",
      ]);
    });
  });
}
