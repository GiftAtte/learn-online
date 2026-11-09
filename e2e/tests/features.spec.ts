import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "admin@learnonline.dev", password: "Admin123!" };
const LEARNER = { email: "learner@learnonline.dev", password: "Learner123!" };

const signIn = async (
  page: Page,
  who: { email: string; password: string },
  home: string,
) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password", { exact: true }).fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(home);
};

test.describe("sign-in and profile", () => {
  test("the sign-in form has icons and a show/hide password toggle", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    const password = page.getByLabel("Password", { exact: true });
    await password.fill("Secret123");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("Secret123");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
    // Pressing the eye must not have tried to sign in.
    await expect(page).toHaveURL(/sign-in/);
  });

  test("a new person can change their name and password from the profile page", async ({
    page,
  }) => {
    const email = `profile${Date.now()}@example.com`;
    await page.goto("/sign-up");
    await page.getByLabel("Full name").fill("Pat Profile");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Passw0rd123");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL("/learner/catalog");

    await page
      .getByRole("button", { name: /Account menu/ })
      .first()
      .click();
    await page.getByRole("menuitem", { name: "Your profile" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Pat Profile" }),
    ).toBeVisible();

    // Name
    await page.getByLabel("Full name").fill("Pat Renamed");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Pat Renamed" }),
    ).toBeVisible();

    // Wrong current password: explained on the field, and still signed in.
    await page.getByLabel("Current password").fill("WrongPass999");
    await page.getByLabel("New password", { exact: true }).fill("Brandnew123");
    await page.getByLabel("Confirm new password").fill("Brandnew123");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(
      page.getByText("That is not your current password"),
    ).toBeVisible();
    await expect(page).toHaveURL("/profile");

    // Mismatched confirmation is caught before anything is sent.
    await page.getByLabel("Current password").fill("Passw0rd123");
    await page.getByLabel("Confirm new password").fill("Different123");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("The two passwords don’t match")).toBeVisible();

    // The right values work, and stay signed in here.
    await page.getByLabel("Confirm new password").fill("Brandnew123");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText(/Password changed/)).toBeVisible();
    await expect(page).toHaveURL("/profile");

    // Sign out; the old password is refused and the new one works.
    await page.getByRole("button", { name: "Sign out" }).last().click();
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Passw0rd123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText(/Invalid email or password|don’t match/i).first(),
    ).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("Brandnew123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/learner/catalog");
  });

  test("a learner cannot reach settings, and signed-in people keep the landing page links", async ({
    page,
  }) => {
    await signIn(page, LEARNER, "/learner/catalog");
    await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toHaveCount(
      0,
    );

    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    await expect(nav.getByRole("link", { name: "How it works" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "What you get" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Courses" })).toHaveAttribute(
      "href",
      "/learner/catalog",
    );
  });
});

/**
 * A learner these tests make for themselves, so they never depend on anyone else's progress:
 * enrolled in TypeScript for Professionals, with one lesson finished and another stopped at 10 seconds.
 */
const student = {
  name: "Fiona Feature",
  email: `feature${Date.now()}@example.com`,
  password: "Passw0rd123",
};
let courseId = "";

test.describe.serial("pages that depend on a learner’s progress", () => {
  test.beforeAll(async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto("/sign-up");
    await page.getByLabel("Full name").fill(student.name);
    await page.getByLabel("Email").fill(student.email);
    await page.getByLabel("Password", { exact: true }).fill(student.password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL("/learner/catalog");

    const found = await page.request.get(
      "/api/v1/courses?q=TypeScript+for+Professionals",
    );
    courseId = (await found.json()).data[0].id;
    expect(
      (await page.request.post(`/api/v1/courses/${courseId}/enroll`)).ok(),
    ).toBe(true);
    const course = (
      await (await page.request.get(`/api/v1/courses/${courseId}`)).json()
    ).data;
    // Stop part-way through the longest of the later lessons (the second is only 10 seconds long).
    const lessons = course.lessons as {
      id: string;
      durationSeconds: number;
    }[];
    const first = lessons[0]!;
    const stopped = lessons[lessons.length - 1]!;
    await page.request.put(`/api/v1/lessons/${first.id}/progress`, {
      data: { positionSeconds: first.durationSeconds, completed: true },
    });
    await page.request.put(`/api/v1/lessons/${stopped.id}/progress`, {
      data: { positionSeconds: 10 },
    });
    await context.close();
  });

  test("my learning: resume band, filters, search and a row that opens the course", async ({
    page,
  }) => {
    await signIn(page, student, "/learner/catalog");
    await page.goto("/learner/my-learning");
    await expect(
      page.getByRole("heading", { level: 1, name: "My learning" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Continue learning" }),
    ).toBeVisible();

    const row = page
      .getByRole("listitem")
      .filter({ hasText: "TypeScript for Professionals" });
    await expect(row).toContainText("1 of");
    await expect(row).toContainText("lessons done");
    await expect(row.getByText("Continue")).toBeVisible();

    // Filters show the right counts and are kept in the address.
    await expect(
      page.getByRole("tab", { name: /^In progress\s*1/ }),
    ).toBeVisible();
    await page.getByRole("tab", { name: /^Completed/ }).click();
    await expect(page).toHaveURL(/status=COMPLETED/);
    await expect(page.getByText("Nothing here yet")).toBeVisible();
    await page.getByRole("tab", { name: /^In progress/ }).click();
    await expect(row).toBeVisible();

    // Search.
    await page
      .getByRole("searchbox", { name: "Search my courses" })
      .fill("zzzz-nothing");
    await expect(page.getByText("No matches")).toBeVisible();
    await page
      .getByRole("searchbox", { name: "Search my courses" })
      .fill("typescript");
    await expect(row).toBeVisible();

    await row
      .getByRole("link", { name: "TypeScript for Professionals" })
      .click();
    await expect(page).toHaveURL(/\/learner\/courses\//);
  });

  test("the lesson page shows compact thumbnails beside the video", async ({
    page,
  }) => {
    await signIn(page, student, "/learner/catalog");
    await page.goto("/learner/my-learning");
    await page.getByRole("link", { name: /Resume lesson/ }).click();
    await expect(page).toHaveURL(/\/learner\/lessons\//);

    const side = page
      .getByRole("heading", { name: "Course lessons" })
      .locator("xpath=ancestor::section[1]");
    const thumb = side.locator("li img").first();
    await expect(thumb).toBeVisible();
    expect((await thumb.boundingBox())!.width).toBeLessThanOrEqual(110); // compact is 6rem (102px at the app font size); it was 10rem (170px)
  });

  test("learners: clicking anywhere on a row opens that learner, as the administrator sees them", async ({
    page,
  }) => {
    await signIn(page, ADMIN, "/admin");
    await page.goto("/admin/learners");
    await page.getByRole("searchbox").first().fill(student.email);
    const row = page.getByRole("row").filter({ hasText: student.email });
    await expect(row).toBeVisible();
    // Click the "Joined" cell, away from the name link.
    await row.getByRole("cell").nth(1).click();
    await expect(page).toHaveURL(/\/admin\/learners\/[0-9a-f-]{36}$/);
    await expect(
      page.getByRole("heading", { level: 1, name: student.name }),
    ).toBeVisible();
    await expect(page.getByText("TypeScript for Professionals")).toBeVisible();
    await expect(page.getByText("Completed").first()).toBeVisible();
    await expect(page.getByText(/^At 0:10 of/).first()).toBeVisible();
    await expect(page.getByText("Not started").first()).toBeVisible();
  });

  test("course activity page lists enrolled learners and per-lesson completions", async ({
    page,
  }) => {
    await signIn(page, ADMIN, "/admin");
    await page.goto(`/admin/courses/${courseId}/activity`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "TypeScript for Professionals",
      }),
    ).toBeVisible();
    await expect(page.getByText("Completion rate")).toBeVisible();
    await expect(page.getByText(/1 of \d+ finished/).first()).toBeVisible();
    await expect(
      page.getByRole("table", { name: /Learners enrolled/ }),
    ).toContainText(student.name);
  });
});

test("overview: only the latest 10 courses, with a View more button to the full list", async ({
  page,
}) => {
  await signIn(page, ADMIN, "/admin");
  const table = page.getByRole("table", { name: "Course activity" });
  await expect(table).toBeVisible();
  expect(await table.getByRole("row").count()).toBeLessThanOrEqual(11); // header + 10

  await page.getByRole("link", { name: /View more/ }).click();
  await expect(page).toHaveURL("/admin/courses");
});
