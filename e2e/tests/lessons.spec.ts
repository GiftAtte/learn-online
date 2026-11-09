import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "admin@learnonline.dev", password: "Admin123!" };

const signInAsAdmin = async (page: Page) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/admin");
};

test.describe("admin sidebar and the Lessons page (desktop)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("the sidebar is grouped, and Lessons opens a list of every lesson", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    const nav = page.getByRole("navigation", { name: "Main" });

    const names = async (group: string) =>
      nav
        .getByRole("group", { name: group })
        .getByRole("link")
        .allTextContents();
    expect(await names("Content")).toEqual([
      "Courses",
      "Lessons",
      "Categories",
    ]);
    expect(await names("People")).toEqual(["Learners"]);
    expect(await names("Learner view")).toEqual(["View catalog"]);
    await expect(nav.getByRole("link", { name: "Overview" })).toBeVisible();

    await nav.getByRole("link", { name: "Lessons" }).click();
    await expect(page).toHaveURL("/admin/lessons");
    await expect(
      page.getByRole("heading", { level: 1, name: "Lessons" }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: "Lessons" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Lessons of every course are in one table.
    const table = page.getByRole("table", { name: "Lessons" });
    await expect(table.getByRole("row")).not.toHaveCount(1);
    await expect(page.getByText(/^\d+ lessons?$/)).toBeVisible();
  });

  test("searching narrows the list and the search stays in the address", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/admin/lessons");
    const table = page.getByRole("table", { name: "Lessons" });
    await expect(table.getByRole("row")).not.toHaveCount(1);

    await page
      .getByRole("searchbox", { name: "Search lessons" })
      .fill("Structuring a Talk");
    await expect(page).toHaveURL(/q=Structuring/);
    const rows = table
      .getByRole("row")
      .filter({ hasText: "Structuring a Talk" });
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Public Speaking for Developers");
    // Only that lesson is left (header row plus one).
    await expect(table.getByRole("row")).toHaveCount(2);

    await page
      .getByRole("searchbox", { name: "Search lessons" })
      .fill("zzzz-no-such-lesson");
    await expect(page.getByText("No matches")).toBeVisible();
  });

  test("a lesson's course link opens that course's lesson manager", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/admin/lessons?q=Structuring+a+Talk");
    await page
      .getByRole("table", { name: "Lessons" })
      .getByRole("link", { name: "Public Speaking for Developers" })
      .click();
    await expect(page).toHaveURL(/\/admin\/courses\/[0-9a-f-]+$/);
    await expect(
      page.getByRole("button", { name: "Add lesson" }).first(),
    ).toBeVisible();
  });

  test("learners cannot open the Lessons page", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("learner@learnonline.dev");
    await page.getByLabel("Password", { exact: true }).fill("Learner123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/learner/catalog");
    await page.goto("/admin/lessons");
    // The page is replaced by a "not allowed" message; none of the lessons are shown.
    await expect(
      page.getByRole("heading", { level: 1, name: "Lessons" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("searchbox", { name: "Search lessons" }),
    ).toHaveCount(0);
    await expect(page.getByRole("table", { name: "Lessons" })).toHaveCount(0);
    // And the API itself refuses.
    expect((await page.request.get("/api/v1/lessons")).status()).toBe(403);
  });
});

test.describe("admin navigation on a phone", () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test("a menu button opens a drawer with every destination, and there is no bottom tab bar", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    // No cramped tab bar: nothing is fixed to the bottom edge.
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);

    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    for (const name of [
      "Overview",
      "Courses",
      "Lessons",
      "Categories",
      "Learners",
      "View catalog",
      "Settings",
      "Landing page",
    ]) {
      await expect(drawer.getByRole("link", { name })).toBeVisible();
    }
    // It fits the phone: no sideways scrolling, and it leaves a strip of the page to tap to close.
    const box = (await drawer.boundingBox())!;
    expect(box.width).toBeLessThan(375);

    await drawer.getByRole("link", { name: "Categories" }).click();
    await expect(page).toHaveURL("/admin/categories");
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
  });

  test("the drawer closes with Escape or a tap outside, and the avatar still opens the account menu", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.mouse.click(360, 400); // the strip of page to the right of the drawer
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);

    await page
      .locator("header")
      .getByRole("button", { name: /Account menu/ })
      .click();
    await expect(
      page.getByRole("menuitem", { name: "Your profile" }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Settings" })).toHaveCount(
      0,
    );
  });

  test("the Lessons page shows lessons as cards without sideways scrolling", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("link", { name: "Lessons" })
      .click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Lessons" }),
    ).toBeVisible();
    await expect(
      page.getByRole("searchbox", { name: "Search lessons" }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
