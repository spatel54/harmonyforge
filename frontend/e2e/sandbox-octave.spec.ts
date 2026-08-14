import { expect, test } from "@playwright/test";
import {
  dismissFirstRunChrome,
  installGenerateStub,
  selectFirstNotehead,
  uploadSampleXml,
  waitForRiffScoreReady,
} from "./helpers";

test.describe("Sandbox toolbar Octave ↓/↑", () => {
  test.beforeEach(async ({ page }) => {
    await dismissFirstRunChrome(page);
    installGenerateStub(page);
    await uploadSampleXml(page);
    await page.getByTestId("generate-harmonies").click();
    await page.waitForURL("**/sandbox", { timeout: 90_000 });
    await waitForRiffScoreReady(page);
  });

  test("Octave ↓ then ↑ moves pitch on first toolbar click", async ({ page }) => {
    await expect(page.getByTestId("sandbox-palette-dock")).toBeVisible();

    await selectFirstNotehead(page);

    const octaveDown = page.getByTitle(/Transpose selected notes down one octave/i);
    const octaveUp = page.getByTitle(/Transpose selected notes up one octave/i);

    await expect(octaveDown).toBeEnabled();

    const pitchBefore = await page
      .locator(".riff-ScoreCanvas__svg text.NoteHead")
      .first()
      .boundingBox();

    await octaveDown.click();
    await page.waitForTimeout(300);

    const pitchAfterDown = await page
      .locator(".riff-ScoreCanvas__svg text.NoteHead")
      .first()
      .boundingBox();

    expect(pitchAfterDown).toBeTruthy();
    expect(pitchBefore).toBeTruthy();
    expect(pitchAfterDown!.y).toBeGreaterThan(pitchBefore!.y + 4);

    await octaveUp.click();
    await page.waitForTimeout(300);

    const pitchAfterUp = await page
      .locator(".riff-ScoreCanvas__svg text.NoteHead")
      .first()
      .boundingBox();

    expect(pitchAfterUp!.y).toBeLessThan(pitchAfterDown!.y + 4);
  });

  test("F9 toggles palette dock", async ({ page }) => {
    const dock = page.getByTestId("sandbox-palette-dock");
    await expect(dock).toBeVisible();
    await page.keyboard.press("F9");
    await expect(dock).toBeHidden();
    await page.keyboard.press("F9");
    await expect(dock).toBeVisible();
  });
});
