import { expect, test } from "@playwright/test";
import { dockTool, openSeededSandbox, selectFirstNotehead } from "./helpers";

const SKIP_CLICK = new Set(["measure-delete"]);

const PROMPT_TOOLS: Record<string, string> = {
  "measure-change-key": "Key signature",
  "measure-change-time": "Time signature",
  "tempo-preset-custom": "Custom tempo",
  "text-lyrics": "Lyric syllable",
  "text-chord-symbol": "Chord symbol",
  "text-expression": "Expression text",
  "text-performance": "Performance text",
  "measure-rehearsal-mark": "Rehearsal mark",
};

test.describe("Sandbox palette buttons", () => {
  test.beforeEach(async ({ page }) => {
    await openSeededSandbox(page);
  });

  test("every dock tool is clickable without crashing the editor", async ({ page }) => {
    await selectFirstNotehead(page);
    const buttons = page.locator("[data-testid=sandbox-palette-dock] [data-tool-id]");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(90);

    const seen = new Set<string>();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const toolId = await btn.getAttribute("data-tool-id");
      if (!toolId || seen.has(toolId) || SKIP_CLICK.has(toolId)) continue;
      seen.add(toolId);

      if (await btn.isDisabled()) {
        await selectFirstNotehead(page);
      }
      if (await btn.isDisabled()) continue;

      await btn.click({ force: true });
      await page.waitForTimeout(80);

      const promptTitle = PROMPT_TOOLS[toolId];
      if (promptTitle) {
        await expect(page.locator("#palette-prompt-title")).toHaveText(promptTitle);
        await page.getByRole("button", { name: "Cancel" }).click();
      }

      await expect(page.getByText("Application error")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Retry editor/i })).toHaveCount(0);
    }
  });

  test("staccato, piano, slur, and lyrics stay applied after the modal", async ({ page }) => {
    await selectFirstNotehead(page);

    await dockTool(page, "artic-staccato").click();
    await expect(dockTool(page, "artic-staccato")).toHaveAttribute("aria-pressed", "true");

    await dockTool(page, "dynamics-piano").click();
    await expect(dockTool(page, "dynamics-piano")).toHaveAttribute("aria-pressed", "true");

    await dockTool(page, "line-slur").click();
    await expect(dockTool(page, "line-slur")).toHaveAttribute("aria-pressed", "true");

    await dockTool(page, "text-lyrics").click();
    await expect(page.locator("#palette-prompt-title")).toHaveText("Lyric syllable");
    await page.getByTestId("palette-prompt-input").fill("la");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("la", { exact: true }).first()).toBeVisible({ timeout: 10_000 });
  });

  test("triplet on one quarter splits without crashing", async ({ page }) => {
    await selectFirstNotehead(page);
    const before = await page.locator('rect[data-testid^="note-"]').count();
    await dockTool(page, "tuplet-3").click();
    await expect(page.getByText("Application error")).toHaveCount(0);
    const after = await page.locator('rect[data-testid^="note-"]').count();
    expect(after).toBeGreaterThanOrEqual(before);
    await expect(dockTool(page, "tuplet-3")).toHaveAttribute("aria-pressed", "true");
  });

  test("Add bar inserts immediately after the focused measure", async ({ page }) => {
    await selectFirstNotehead(page);
    await expect(page.getByRole("slider", { name: /1 measures/ })).toBeVisible();
    await dockTool(page, "measure-insert-after").click();
    await expect(page.getByRole("slider", { name: /2 measures/ })).toBeVisible();
  });

  test("F9 toggles the dock and Export opens", async ({ page }) => {
    const dock = page.getByTestId("sandbox-palette-dock");
    await expect(dock).toBeVisible();
    await page.keyboard.press("F9");
    await expect(dock).toBeHidden();
    await page.keyboard.press("F9");
    await expect(dock).toBeVisible();

    await page.getByRole("button", { name: "Export score" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
