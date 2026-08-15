import { expect, test } from "@playwright/test";
import {
  dismissFirstRunChrome,
  installGenerateStub,
  uploadSampleXml,
  waitForRiffScoreReady,
} from "./helpers";

test.describe("Export modal letter names", () => {
  test.beforeEach(async ({ page }) => {
    await dismissFirstRunChrome(page);
    installGenerateStub(page);
    await uploadSampleXml(page);
    await page.getByTestId("generate-harmonies").click();
    await page.waitForURL("**/sandbox", { timeout: 90_000 });
    await waitForRiffScoreReady(page);
  });

  test("Letter Names toggle shows labels in PDF preview", async ({ page }) => {
    await page.getByRole("button", { name: /Export score/i }).click();
    await expect(page.getByRole("dialog", { name: /PDF preview/i })).toBeVisible({
      timeout: 15_000,
    });

    const exportDialog = page.getByRole("dialog", { name: /PDF preview/i });
    const letterToggle = exportDialog.getByRole("checkbox", {
      name: /Show letter names above each notehead/i,
    });
    if (!(await letterToggle.isChecked())) {
      await letterToggle.check();
    }
    await expect(letterToggle).toBeChecked();

    await expect(page.locator(".hf-export-osmd-preview .hf-osmd-letter-label").first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
