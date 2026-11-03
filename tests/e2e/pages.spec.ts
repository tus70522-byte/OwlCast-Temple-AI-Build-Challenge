import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations, runDemoToForecast, trackConsole } from "./helpers";

test.describe("accessibility (axe): zero serious or critical violations", () => {
  for (const url of ["/", "/insights", "/responsible"]) {
    test(url, async ({ page }) => {
      const problems = trackConsole(page);
      await page.goto(url);
      await page.waitForTimeout(800);
      await expect(page.locator("h1")).toHaveCount(1);
      await expectNoSeriousA11yViolations(page, url);
      expect(problems).toEqual([]);
    });
  }

  test("/plan through every step of the demo", async ({ page }) => {
    const problems = trackConsole(page);
    await page.goto("/plan");
    await expect(page.getByRole("heading", { name: "Set up your semester" })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "/plan step 1");
    await page.getByRole("radio", { name: /Custom dates/ }).check({ force: true });
    await page.getByRole("button", { name: "Add a shift" }).click();
    await expectNoSeriousA11yViolations(page, "/plan step 1 (custom + shift)");

    await page.goto("/plan?demo=1");
    await expect(page.getByRole("heading", { name: "Upload your syllabi" })).toBeVisible();
    await page.getByRole("button", { name: "Paste syllabus text instead" }).click();
    await expectNoSeriousA11yViolations(page, "/plan step 2");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Instant demo" }).click();
    await page.getByRole("button", { name: "Check what we found" }).click();
    await expect(page.getByRole("heading", { name: /Here's what we found/ })).toBeVisible();
    await expectNoSeriousA11yViolations(page, "/plan step 3");
    await page.getByRole("button", { name: "Build my forecast" }).click();
    await expect(page.getByRole("heading", { name: "Your Spring 2027 forecast" })).toBeVisible();
    await page.waitForTimeout(800);
    await expectNoSeriousA11yViolations(page, "/plan step 4");
    expect(problems).toEqual([]);
  });
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
});

test("API errors are plain JSON with no stack traces", async ({ request }) => {
  const res = await request.post("/api/extract", { multipart: { file: { name: "x.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") }, semesterId: "spring-2027" } });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ error: "OwlCast reads PDF, Word (.docx), and plain text (.txt) files." });
});

test("setup validation: custom dates need an end after the start", async ({ page }) => {
  await page.goto("/plan");
  await page.getByText("Custom dates").click();
  await page.getByLabel("First day of classes").fill("2027-06-01");
  await page.getByLabel("Last day of the semester").fill("2027-05-01");
  await page.getByRole("button", { name: "Continue to upload" }).click();
  const end = page.getByLabel("Last day of the semester");
  await expect(end).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("The end date must be after the start date.")).toBeVisible();
  const describedBy = await end.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await page.getByLabel("Last day of the semester").fill("2027-08-01");
  await page.getByRole("button", { name: "Continue to upload" }).click();
  await expect(page.getByRole("heading", { name: "Upload your syllabi" })).toBeVisible();
});

test("upload: real file, rejected file, and pasted text", async ({ page }) => {
  await page.goto("/plan");
  await page.getByRole("button", { name: "Continue to upload" }).click();
  const input = page.locator('input[type="file"]');
  await input.setInputFiles([
    { name: "risk-management.txt", mimeType: "text/plain", buffer: fs.readFileSync(path.join(process.cwd(), "public/sample-syllabi/risk-management.txt")) },
    { name: "photo.png", mimeType: "image/png", buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
  ]);
  await expect(page.getByText("OwlCast reads PDF, Word (.docx), and plain text (.txt) files.")).toBeVisible();
  await expect(page.getByText("14 items found", { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Paste syllabus text instead" }).click();
  await page.getByLabel("Course name").fill("PSY 1001");
  await page.getByLabel("Syllabus text").fill("Midterm exam Week 6 Wednesday, 25%. Term paper Week 11 Friday, 20%.");
  await page.getByRole("button", { name: "Read this text" }).click();
  await expect(page.getByText("4 items found", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Check what we found" })).toBeEnabled();
});

test("keyboard: skip link and step indicator", async ({ page }) => {
  await page.goto("/plan");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await expect(page.locator('[aria-current="step"]')).toContainText("Setup");
});

test("landing page links into the demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("See your hardest week before it sees you.");
  await page.getByRole("link", { name: "Watch the demo" }).click();
  await expect(page.getByRole("heading", { name: "Upload your syllabi" })).toBeVisible();
});

test("mobile: no horizontal scroll on any page", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  for (const url of ["/", "/insights", "/responsible", "/plan"]) {
    await page.goto(url);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(375);
  }
  await runDemoToForecast(page, "instant");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await ctx.close();
});
