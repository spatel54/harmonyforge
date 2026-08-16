import { expect, test } from "@playwright/test";
import {
  dismissFirstRunChrome,
  installGenerateStub,
  editMelodyDuration,
  uploadSampleXml,
  waitForRiffScoreReady,
} from "./helpers";

test.describe("Document live melody → Generate", () => {
  test.beforeEach(async ({ page }) => {
    await dismissFirstRunChrome(page);
  });

  test("posts edited melody XML when staff changes before Generate", async ({ page }) => {
    const { getUploadedXml } = installGenerateStub(page);

    await uploadSampleXml(page);
    await waitForRiffScoreReady(page);

    await editMelodyDuration(page);

    await page.getByTestId("generate-harmonies").click();
    await page.waitForURL("**/sandbox", { timeout: 90_000 });

    const uploaded = await getUploadedXml();
    expect(uploaded).toBeTruthy();
    const melodyPart = uploaded!.match(/<part id="P1">[\s\S]*?<\/part>/)?.[0] ?? uploaded!;
    expect(melodyPart).toMatch(/<type>32nd<\/type>/);
    expect(melodyPart).not.toMatch(/<type>whole<\/type>/);
  });

  test("keeps original XML when staff is not edited", async ({ page }) => {
    const { getUploadedXml } = installGenerateStub(page);

    await uploadSampleXml(page);
    await waitForRiffScoreReady(page);

    await page.getByTestId("generate-harmonies").click();
    await page.waitForURL("**/sandbox", { timeout: 90_000 });

    const uploaded = await getUploadedXml();
    expect(uploaded).toBeTruthy();
    expect(uploaded).toMatch(/<type>whole<\/type>/);
  });
});
