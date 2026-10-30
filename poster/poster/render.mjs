import { chromium } from "/Users/dvgenis/Desktop/harmonyforge/frontend/node_modules/playwright/index.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(dir, "index.html");
const pdfPath = path.join(dir, "HarmonyForge_ISMIR2026_LBD_poster.pdf");
const pngPath = path.join(dir, "preview.png");

const mm = 96 / 25.4;
const W = Math.round(841 * mm);
const H = Math.round(1189 * mm);

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto("file://" + html, { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: ".screen-only{display:none!important}" });
await page.evaluate(() => { document.body.style.transform = "none"; });
await page.waitForTimeout(1500);

await page.pdf({
  path: pdfPath,
  width: "841mm",
  height: "1189mm",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  preferCSSPageSize: true,
});

await page.screenshot({ path: pngPath, fullPage: false, type: "png" });
await browser.close();
console.log("Wrote", pdfPath);
console.log("Wrote", pngPath);
console.log("Viewport", W, "x", H);
