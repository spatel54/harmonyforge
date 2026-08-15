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

/** Four-quarter melody + harmony — enough notes for slurs, tuplets, and lyrics. */
export const PALETTE_QA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Melody</part-name></score-part>
    <score-part id="P2"><part-name>Harmony</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>F</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
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
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

export async function openSeededSandbox(page: Page, xml = PALETTE_QA_XML): Promise<void> {
  await dismissFirstRunChrome(page);
  await page.addInitScript(
    ({ seededXml }) => {
      sessionStorage.setItem(
        "harmonyforge-sandbox-state",
        JSON.stringify({ xml: seededXml, sourceFileName: "palette-qa" }),
      );
      localStorage.setItem("hf_inspector_fab_hint_dismissed", "1");
    },
    { seededXml: xml },
  );
  await page.goto("/sandbox");
  await waitForRiffScoreReady(page);
  // Collapsed sections unmount their tools (default open: note-entry / articulations / dynamics).
  await page.getByTestId("palette-expand-all").click();
  await dockTool(page, "tuplet-3").waitFor({ state: "attached", timeout: 15_000 });
  // #region agent log
  await page.evaluate(() => {
    const dock = document.querySelector("[data-testid=sandbox-palette-dock]");
    const tup = dock?.querySelector('[data-tool-id="tuplet-3"]') as HTMLButtonElement | null;
    const sections = [...(dock?.querySelectorAll("[aria-controls^='palette-section-']") ?? [])].map((el) => ({
      id: el.getAttribute("aria-controls"),
      expanded: el.getAttribute("aria-expanded"),
    }));
    fetch("http://127.0.0.1:7406/ingest/555ec36b-f260-4597-b685-d87aa80b5dde", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "73a776" },
      body: JSON.stringify({
        sessionId: "73a776",
        runId: "post-fix",
        hypothesisId: "A",
        location: "e2e/helpers.ts:openSeededSandbox",
        message: "dock after Expand all",
        data: {
          toolCount: dock?.querySelectorAll("[data-tool-id]").length ?? 0,
          hasTuplet: Boolean(tup),
          tupDisabled: tup?.disabled ?? null,
          tupletsExpanded: sections.find((s) => s.id === "palette-section-tuplets")?.expanded ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  });
  // #endregion
}

export function dockTool(page: Page, toolId: string) {
  return page.locator(`[data-testid=sandbox-palette-dock] [data-tool-id="${toolId}"]`).first();
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
