import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export function trackConsole(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

export async function expectNoSeriousA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const summary = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  expect(summary, `${label} has serious/critical axe violations`).toEqual([]);
}

/** /plan?demo=1 → demo syllabi → confirm → forecast */
export async function runDemoToForecast(page: Page, mode: "live" | "instant" = "live") {
  await page.goto("/plan?demo=1");
  await expect(page.getByRole("heading", { name: "Upload your syllabi" })).toBeVisible();
  if (mode === "live") await page.getByRole("button", { name: "Try with demo syllabi" }).click();
  else await page.getByRole("button", { name: "Instant demo" }).click();
  await expect(page.getByText("45 items from 4 courses")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Check what we found" }).click();
  await expect(page.getByRole("heading", { name: /Here's what we found/ })).toBeVisible();
  await page.getByRole("button", { name: "Build my forecast" }).click();
  await expect(page.getByRole("heading", { name: "Your Spring 2027 forecast" })).toBeVisible();
}
