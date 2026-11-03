// Dev helper: node scripts/screenshot.mjs <url> <outPrefix> [widths...] -- full-page screenshots + console errors
import { chromium } from "playwright";
const [url, out, ...ws] = process.argv.slice(2);
const sizes = (ws.length ? ws : ["1280x720", "375x812"]).map((s) => s.split("x").map(Number));
const browser = await chromium.launch();
for (const [w, h] of sizes) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errs.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.screenshot({ path: `${out}-${w}.png`, fullPage: process.env.FULL !== "0" });
  console.log(`${w}x${h}: scrollWidth=${sw}`, errs.length ? errs : "no console errors");
  await page.close();
}
await browser.close();
