import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/ai/llmClient";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { Persona } from "@/lib/ai/prompts";
import {
  getTaxonomyContext,
  getFallbackExplanation,
  type Genre,
  type ViolationKey,
} from "@/lib/ai/taxonomyIndex";
import {
  resolveExplanationLevel,
  type ExplanationLevel,
} from "@/lib/ai/explanationLevel";
import type { TheoryInspectorMode } from "@/lib/music/theoryInspectorMode";

interface TheoryInspectorRequestBody {
  persona: Persona;
  genre: Genre;
  userMessage: string;
  violationType?: ViolationKey;
  violationContext?: string;
  /** Editor focus facts (note / measure / part); merged with violationContext in prompts when alone */
  scoreSelectionContext?: string;
  theoryInspectorNoteMode?: TheoryInspectorMode;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  explanationLevel?: ExplanationLevel;
}

/**
 * POST /api/theory-inspector
 *
 * Streams an LLM response through the Theory Inspector.
 * Falls back to Taxonomy.md definitions when no API key is configured.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as TheoryInspectorRequestBody;
  const {
    persona,
    genre,
    userMessage,
    violationType,
    violationContext,
    scoreSelectionContext,
    theoryInspectorNoteMode,
  } = body;

  // Validate required fields
  if (!persona || !genre || !userMessage) {
    return NextResponse.json(
      { error: "Missing required fields: persona, genre, userMessage" },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const explanationLevel = resolveExplanationLevel(body.explanationLevel);

  // --- Fallback mode: no API key ---
  if (!apiKey) {
    const fallbackContent = violationType
      ? getFallbackExplanation(violationType)
      : getTaxonomyContext(genre);

    return NextResponse.json({
      content:
        fallbackContent +
        "\n\n_[Offline mode — add OPENAI_API_KEY to .env.local for full AI explanations]_",
      source: "fallback" as const,
      chips: getChipsForPersona(persona, violationType),
    });
  }

  // --- Live LLM mode ---
  const taxonomySection = getTaxonomyContext(genre, violationType);
  const systemPrompt = buildSystemPrompt(persona, {
    genre,
    taxonomySection,
    violationType,
    violationContext,
    scoreSelectionContext: scoreSelectionContext ?? violationContext,
    theoryInspectorNoteMode,
    explanationLevel,
  });

  // Build conversation history (capped at last 10 exchanges)
  const history = (body.conversationHistory ?? []).slice(-20);
  const messages = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const stream = await streamChat(apiKey, model, systemPrompt, messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `LLM request failed: ${message}` },
      { status: 502 },
    );
  }
}

/** Return contextual quick-reply chips based on persona and violation type. */
function getChipsForPersona(
  persona: Persona,
  violationType?: string,
): string[] {
  if (violationType) {
    switch (persona) {
      case "auditor":
        return ["Explain more", "Suggest fix", "Show in score"];
      case "tutor":
        return ["Suggest fix", "Show example", "Why does this matter?"];
      case "stylist":
        return ["Apply fix", "Show alternate options", "Explain rule"];
    }
  }
  return ["Explain this chord", "Check voice leading", "Suggest correction"];
}

/**
 * GET /api/theory-inspector
 * Health check — also tells the client whether an API key is configured.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    hasApiKey: !!process.env.OPENAI_API_KEY,
  });
}
