import type { Page } from "@playwright/test";
import path from "node:path";

/** Dismiss onboarding modal, sandbox overlay, and coachmark tour. */
export async function dismissFirstRunChrome(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem("harmonyforge-onboarding-v1-complete", "1");
    window.localStorage.setItem("hf_onboarding_seen", "1");
    window.localStorage.setItem(
      "hf-coachmarks-v2",
      JSON.stringify({ state: { isActive: false, currentStep: 1, hasDismissed: true }, version: 0 }),
    );
  });
}

export async function uploadSampleXml(page: Page, fileName = "tour_demo.xml"): Promise<void> {
  const samplePath = path.join(process.cwd(), "public", "samples", fileName);
  await page.goto("/");
  await page.getByTestId("hf-file-input").setInputFiles(samplePath);
  await page.waitForURL("**/document", { timeout: 60_000 });
}

export async function waitForRiffScoreReady(page: Page): Promise<void> {
  await page.locator(".riff-ScoreCanvas__svg rect[data-testid^='note-']").first().waitFor({
    state: "visible",
    timeout: 60_000,
  });
}

export async function selectFirstNotehead(page: Page): Promise<void> {
  await waitForRiffScoreReady(page);
  const note = page.locator(".riff-ScoreCanvas__svg rect[data-testid^='note-']").first();
  await note.click({ force: true });
}

/** Shorten the first melody note via RiffScore duration key (whole → 32nd). */
export async function editMelodyDuration(page: Page): Promise<void> {
  await selectFirstNotehead(page);
  await page.keyboard.press("2");
  await page.waitForTimeout(200);
}

/** Stub SATB output so generate does not wait on the solver. */
export const GENERATED_STUB_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Melody</part-name></score-part>
    <score-part id="P2"><part-name>Violin</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

export function installGenerateStub(page: Page): {
  getUploadedXml: () => Promise<string | null>;
} {
  let uploadedXml: string | null = null;

  page.route("**/api/generate-from-file", async (route) => {
    const request = route.request();
    const body = request.postDataBuffer();
    if (body) {
      const text = body.toString("utf8");
      const match = text.match(/<\?xml[\s\S]*<\/score-partwise>/);
      uploadedXml = match ? match[0] : text;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/xml",
      body: GENERATED_STUB_XML,
    });
  });

  return {
    getUploadedXml: async () => uploadedXml,
  };
}
