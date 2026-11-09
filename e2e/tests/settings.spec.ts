import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "admin@learnonline.dev", password: "Admin123!" };

const signIn = async (page: Page, email: string, password: string) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/admin");
};

const DEFAULT_SETTINGS = {
  appName: "LearnOnline",
  tagline: "",
  logoUrl: "",
  supportEmail: "",
  imageMaxMegabytes: 10,
  videoMaxMegabytes: 100,
  imageFormats: ["jpg", "jpeg", "png", "webp", "gif"],
  videoFormats: ["mp4", "webm", "mov"],
  allowSignups: true,
};

// These tests change the application settings (even closing sign-ups). However the run ends, put the
// defaults back, so a failure here can never leave the app renamed or closed to new people.
test.afterAll(async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL });
  await api.post("/api/v1/auth/login", {
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  await api.put("/api/v1/settings", { data: DEFAULT_SETTINGS });
  await api.dispose();
});

test.describe.serial("admin settings and profile", () => {
  test("Settings and the landing page link live in the sidebar footer", async ({
    page,
  }) => {
    await signIn(page, ADMIN.email, ADMIN.password);

    // Not in the main menu any more...
    await expect(
      page
        .getByRole("navigation", { name: "Main" })
        .first()
        .getByRole("link", { name: "Settings" }),
    ).toHaveCount(0);
    // ...but pinned at the bottom, next to the landing page link.
    await page.getByRole("link", { name: "Settings" }).first().click();
    await expect(page).toHaveURL("/admin/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    const landing = page.getByRole("link", { name: "Landing page" });
    await expect(landing).toHaveAttribute("href", "/");
  });

  test("settings are split into vertical tabs, and the open tab is in the address", async ({
    page,
  }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/settings");
    const tabs = page.getByRole("tablist", { name: "Settings sections" });
    await expect(tabs).toHaveAttribute("aria-orientation", "vertical");
    await expect(tabs.getByRole("tab")).toHaveText([
      /^Application/,
      /^Branding/,
      /^Media/,
      /^Access/,
    ]);

    await tabs.getByRole("tab", { name: "Media" }).click();
    await expect(page).toHaveURL(/tab=media/);
    await expect(page.getByLabel("Largest video (MB)")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Largest video (MB)")).toBeVisible();
  });

  test("changes across tabs are saved together and shown across the app", async ({
    page,
  }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/settings");

    await page.getByLabel("Application name").fill("Brightpath");
    await page
      .getByRole("textbox", { name: /^Tagline/ })
      .fill("Learn a little every day");
    await page.getByRole("tab", { name: "Media" }).click();
    await page.getByLabel("Largest video (MB)").fill("50");
    await page.getByRole("checkbox", { name: "AVIF" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();

    // The new name is in the sidebar and the browser tab straight away, and survives a reload.
    await expect(
      page.getByRole("link", { name: "Brightpath home" }).first(),
    ).toBeVisible();
    await page.reload();
    await expect(page).toHaveTitle("Brightpath");
    await expect(page.getByLabel("Largest video (MB)")).toHaveValue("50");
    await expect(page.getByRole("checkbox", { name: "AVIF" })).toBeChecked();

    // Public pages show it too, to someone who is not signed in.
    await page.context().clearCookies();
    await page.goto("/sign-in");
    await expect(page.getByText("Learn a little every day")).toBeVisible();
  });

  test("bad values are explained, in whichever tab they are, and nothing is saved", async ({
    page,
  }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/settings?tab=media");
    await page.getByLabel("Largest image (MB)").fill("500");
    await page.getByRole("tab", { name: "Application" }).click();
    await page.getByLabel("Application name").fill("A");
    await page.getByRole("tab", { name: "Access" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Enter at least 2 characters")).toBeVisible();
    await page.getByRole("tab", { name: /Media/ }).click();
    await expect(page.getByText("Use 50 MB or less")).toBeVisible();
  });

  test("closing sign-ups closes the sign-up page", async ({ page }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/settings?tab=access");
    await page.getByRole("switch", { name: /allow new sign-ups/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();

    await page.context().clearCookies();
    await page.goto("/sign-up");
    await expect(page.getByText("New sign-ups are closed")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toHaveCount(0);
  });

  test("puts the defaults back so other tests are unaffected", async ({
    page,
  }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/settings");
    await page.getByLabel("Application name").fill("LearnOnline");
    await page.getByRole("textbox", { name: /^Tagline/ }).fill("");
    await page.getByRole("tab", { name: "Media" }).click();
    await page.getByLabel("Largest video (MB)").fill("100");
    await page.getByRole("checkbox", { name: "AVIF" }).click();
    await page.getByRole("tab", { name: "Access" }).click();
    await page.getByRole("switch", { name: /allow new sign-ups/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();
  });

  test("on desktop the avatar lives in the sidebar footer, not the top right, and opens a menu", async ({
    page,
  }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
    // Nothing at the top right on desktop: the header is mobile-only.
    await expect(
      page.locator("header").getByRole("button", { name: /Account menu/ }),
    ).toHaveCount(0);
    const inSidebar = page
      .locator("aside")
      .getByRole("button", { name: /Account menu/ });
    await expect(inSidebar).toBeVisible();
    await inSidebar.click();
    const menu = page.getByRole("menu");
    await expect(menu).toContainText("admin@learnonline.dev");
    await expect(
      menu.getByRole("menuitem", { name: "Sign out" }),
    ).toBeVisible();

    await menu.getByRole("menuitem", { name: "Your profile" }).click();
    await expect(page).toHaveURL("/profile");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ada Admin" }),
    ).toBeVisible();
    await expect(page.getByLabel("Card number")).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Save payment details" }),
    ).toBeDisabled();
  });
});

test("on a phone the avatar is at the top right and opens the same menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, ADMIN.email, ADMIN.password);
  await expect(page.locator("aside")).toBeHidden();
  await page
    .locator("header")
    .getByRole("button", { name: /Account menu/ })
    .click();
  await expect(page.getByRole("menu")).toContainText("admin@learnonline.dev");
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page).toHaveURL("/admin/settings");
});
