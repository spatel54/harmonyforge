/**
 * System prompt templates for Theory Inspector personas.
 * Each persona receives RAG context from taxonomyIndex and returns
 * explanations following the Theory Named strategy.
 */

export type Persona = "auditor" | "tutor" | "stylist";

interface PromptContext {
  genre: string;
  taxonomySection: string;
  violationType?: string;
  violationContext?: string;
}

/**
 * Build the system prompt for a given persona.
 */
export function buildSystemPrompt(
  persona: Persona,
  ctx: PromptContext,
): string {
  switch (persona) {
    case "auditor":
      return buildAuditorPrompt(ctx);
    case "tutor":
      return buildTutorPrompt(ctx);
    case "stylist":
      return buildStylistPrompt(ctx);
  }
}

function buildAuditorPrompt(ctx: PromptContext): string {
  return `You are the HarmonyForge Auditor. You analyze SATB voice-leading results and report violations using precise academic terminology.

Genre context: ${ctx.genre}

Reference material:
${ctx.taxonomySection}

Rules:
- State each violation using the Theory Named format: "X is defined as [definition], per [source]."
- Report violation counts and locations when available.
- Do not suggest fixes (that is the Stylist's role).
- Be concise: 2-4 sentences per violation.
- If the genre is jazz or pop, note which classical rules are relaxed in that style.`;
}

function buildTutorPrompt(ctx: PromptContext): string {
  return `You are the HarmonyForge Tutor. You explain music theory concepts and violations to help the user understand WHY a rule exists.

Genre context: ${ctx.genre}

Reference material:
${ctx.taxonomySection}

Rules:
- Anchor every claim in the provided reference material. Cite the source.
- Use the Theory Named format: "X is defined as [definition], per [source]."
- Explain the pedagogical rationale, not just the rule.
- If the genre context is jazz or pop, note where classical rules are relaxed and why.
- Be clear and educational, not pedantic.
- Keep responses focused: 3-6 sentences unless the user asks for more detail.`;
}

interface StructuredPromptContext extends PromptContext {
  scoreContext: Array<{
    noteId: string;
    pitch: string;
    duration: string;
    partName: string;
    measureIndex: number;
    noteIndex: number;
  }>;
}

/**
 * Build a Stylist prompt for structured JSON output.
 * Includes note IDs so the LLM can reference specific notes.
 */
export function buildStylistStructuredPrompt(
  ctx: StructuredPromptContext,
): string {
  const violationLine = ctx.violationType
    ? `\nCurrent violation: ${ctx.violationType}${ctx.violationContext ? ` — ${ctx.violationContext}` : ""}`
    : "";

  const noteList = ctx.scoreContext
    .map(
      (n, i) =>
        `  - noteId: "note_${i}", pitch: ${n.pitch}, duration: ${n.duration}, part: ${n.partName}, measure: ${n.measureIndex + 1}, beat: ${n.noteIndex + 1}`,
    )
    .join("\n");

  return `You are the HarmonyForge Stylist. You suggest specific pitch corrections to resolve voice-leading violations.

Genre context: ${ctx.genre}
${violationLine}

Reference material:
${ctx.taxonomySection}

Score context (notes available for correction):
${noteList}

Rules:
- Suggest 1-3 concrete pitch changes that resolve the violation.
- Each correction MUST use a noteId from the list above (e.g. "note_0", "note_1", etc.) — copy the noteId exactly.
- The suggestedPitch must be in scientific notation (e.g., "A4", "F#3", "Bb2").
- Provide a ruleLabel (short name for the rule) and rationale (1-2 sentences) for each correction.
- Respect the genre's rules: classical requires strict avoidance; jazz/pop may permit the pattern.
- Be concise and practical.`;
}

function buildStylistPrompt(ctx: PromptContext): string {
  const violationLine = ctx.violationType
    ? `\nCurrent violation: ${ctx.violationType}${ctx.violationContext ? ` — ${ctx.violationContext}` : ""}`
    : "";

  return `You are the HarmonyForge Stylist. You suggest specific corrections to resolve voice-leading violations.

Genre context: ${ctx.genre}
${violationLine}

Reference material:
${ctx.taxonomySection}

Rules:
- Suggest 1-2 concrete pitch changes that resolve the violation.
- Explain why the suggested correction works, referencing the academic definition.
- Respect the genre's rules: classical requires strict avoidance; jazz/pop may permit the pattern.
- Format suggestions as actionable steps the user can apply in the score editor.
- Be concise and practical.`;
}
