import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { runDemoToForecast, trackConsole } from "./helpers";

test("demo path: ?demo=1 → demo syllabi → confirm → forecast", async ({ page }) => {
  const problems = trackConsole(page);
  await page.goto("/plan?demo=1");
  await expect(page.locator('[aria-current="step"]')).toContainText("Upload");
  await page.getByRole("button", { name: "Try with demo syllabi" }).click();
  await expect(page.getByText("Reading…").first()).toBeVisible();
  await expect(page.getByText("45 items from 4 courses")).toBeVisible({ timeout: 30_000 });
  for (const n of ["intro-statistics.pdf", "information-systems.pdf", "business-writing.docx", "risk-management.txt"]) {
    await expect(page.getByText(n, { exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "Check what we found" }).click();
  const attention = page.getByRole("region", { name: /Needs your attention/ });
  await expect(attention).toBeVisible();
  await expect(attention.getByText("Final Portfolio")).toBeVisible();
  await expect(attention.getByText('Date is "TBD"', { exact: false })).toBeVisible();
  await expect(attention.getByText(/Calculated from "Week 4"/)).toBeVisible();

  await page.getByRole("button", { name: "Build my forecast" }).click();
  await expect(page.getByRole("heading", { name: "Your Spring 2027 forecast" })).toBeVisible();

  const week7 = page.locator("#week-7");
  await expect(week7.getByText("Storm", { exact: true })).toBeVisible();
  await expect(week7.getByText("Start BCOM 2100 Research Paper by Fri, Feb 12")).toBeVisible();
  await expect(page.locator("#week-8").getByText("Break", { exact: true })).toBeVisible();
  await expect(page.locator("#week-8").getByText(/Spring Break/)).toBeVisible();
  await expect(page.locator("#week-4").getByText("Busy", { exact: true })).toBeVisible();
  await expect(page.locator("#week-12").getByText("Busy", { exact: true })).toBeVisible();
  await expect(page.locator("#week-16")).toContainText("Final exams this week");
  await expect(page.locator("#week-17")).toContainText("Final exams this week");
  await expect(page.getByRole("heading", { name: "Heavy weeks ahead? Talking to someone early helps." })).toBeVisible();
  await expect(page.getByText("This forecast is an estimate based on grade weights.", { exact: false })).toBeVisible();

  // Refresh keeps state.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your Spring 2027 forecast" })).toBeVisible();
  await expect(page.locator("#week-7").getByText("Storm", { exact: true })).toBeVisible();

  expect(problems).toEqual([]);
});

test(".ics export downloads and parses back correctly", async ({ page }) => {
  await runDemoToForecast(page, "instant");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Add to calendar (.ics)" }).click()]);
  expect(download.suggestedFilename()).toBe("owlcast-spring-2027.ics");
  await expect(page.getByText("Calendar file downloaded", { exact: true })).toBeVisible();
  const ics = fs.readFileSync((await download.path())!, "utf8");

  // Parse VEVENTs back into {summary, start, end}.
  const events = ics
    .split("BEGIN:VEVENT")
    .slice(1)
    .map((block) => {
      const unfolded = block.replace(/\r?\n[ \t]/g, "");
      const get = (k: string) => new RegExp(`^${k}[^:]*:(.*)$`, "m").exec(unfolded)?.[1]?.trim();
      return { summary: get("SUMMARY"), start: get("DTSTART"), end: get("DTEND") };
    });
  // 38 dated items + 6 start-date recommendations + Temple (2 no-class + 2 finals + 3 deadlines)
  expect(events).toHaveLength(38 + 6 + 7);
  expect(events).toContainEqual({ summary: "STAT 1001: Midterm Exam (25%)", start: "20270225", end: "20270226" });
  expect(events).toContainEqual({ summary: "MIS 1050: Group Project Milestone (20%)", start: "20270226", end: "20270227" });
  expect(events).toContainEqual({ summary: "Start: BCOM 2100 Research Paper", start: "20270212", end: "20270213" });
  expect(events).toContainEqual({ summary: "Temple: Spring Break", start: "20270301", end: "20270308" });

  // Without Temple events
  await page.getByLabel("Include Temple breaks and deadlines").click();
  const [d2] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Add to calendar (.ics)" }).click()]);
  const ics2 = fs.readFileSync((await d2.path())!, "utf8");
  expect(ics2.split("BEGIN:VEVENT").length - 1).toBe(38 + 6);
  expect(ics2).not.toContain("Temple:");
});

test("Instant demo works with the network off (after page load)", async ({ page, context }) => {
  await page.goto("/plan?demo=1");
  await expect(page.getByRole("heading", { name: "Upload your syllabi" })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Instant demo" }).click();
  await expect(page.getByText("45 items from 4 courses")).toBeVisible();
  await expect(page.getByText("Loaded saved demo result", { exact: true })).toHaveCount(4);
  await page.getByRole("button", { name: "Check what we found" }).click();
  await page.getByRole("button", { name: "Build my forecast" }).click();
  await expect(page.locator("#week-7").getByText("Storm", { exact: true })).toBeVisible();
  await context.setOffline(false);
});

test("live demo falls back to saved results when the API fails", async ({ page }) => {
  await page.route("**/api/extract", (route) => route.fulfill({ status: 502, contentType: "application/json", body: '{"error":"down"}' }));
  await page.goto("/plan?demo=1");
  await page.getByRole("button", { name: "Try with demo syllabi" }).click();
  await expect(page.getByText("45 items from 4 courses")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Loaded saved demo result", { exact: true })).toHaveCount(4);
});

test("edit items, delete with undo, and start over", async ({ page }) => {
  await runDemoToForecast(page, "instant");
  await page.getByRole("button", { name: "Edit items" }).click();
  const attention = page.getByRole("region", { name: /Needs your attention/ });
  // Fix the TBD portfolio date inline.
  const portfolio = attention.getByRole("listitem").filter({ hasText: "Final Portfolio" });
  await portfolio.getByLabel("Due date").fill("2027-04-21");
  await expect(portfolio.getByText('Date is "TBD"', { exact: false })).toHaveCount(0);
  await portfolio.getByRole("button", { name: "Looks right" }).click();
  await expect(attention.getByText("Final Portfolio")).toHaveCount(0);

  // Delete + undo.
  const statHeader = page.getByRole("button", { name: /^STAT 1001/ });
  if ((await statHeader.getAttribute("aria-expanded")) !== "true") await statHeader.click();
  await page.getByRole("button", { name: "Delete Problem Set 1" }).click();
  await expect(page.getByRole("button", { name: "Delete Problem Set 1" })).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Delete Problem Set 1" })).toBeVisible();

  await page.getByRole("button", { name: "Build my forecast" }).click();
  await expect(page.locator("#week-15").getByText("BCOM 2100: Final Portfolio", { exact: true })).toBeVisible();
  await expect(page.locator("#week-15").getByText(/Start BCOM 2100 Final Portfolio by/)).toBeVisible();

  await page.getByRole("button", { name: "Start over" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Start over" }).click();
  await expect(page.getByRole("heading", { name: "Set up your semester" })).toBeVisible();
});
