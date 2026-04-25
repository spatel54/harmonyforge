import { NextRequest, NextResponse } from "next/server";
import { getServerOpenAIEnv, structuredCompletion } from "@/lib/ai/llmClient";
import { buildStylistStructuredPrompt } from "@/lib/ai/prompts";
import {
  getTaxonomyContext,
  type Genre,
  type ViolationKey,
} from "@/lib/ai/taxonomyIndex";
import {
  isSuggestionExplanationMode,
  type SuggestionExplanationMode,
} from "@/lib/study/studyConfig";
import {
  suggestResponseSchema,
  type SuggestResponse,
} from "@/lib/ai/suggestionSchema";

interface ScoreNoteContext {
  noteId: string;
  pitch: string;
  duration: string;
  partName: string;
  measureIndex: number;
  noteIndex: number;
}

interface SuggestRequestBody {
  genre: Genre;
  violationType?: ViolationKey;
  violationContext?: string;
  scoreContext: ScoreNoteContext[];
  userMessage?: string;
  /** M5 RQ2: when "minimal", strip rationale/summary from the JSON response */
  suggestionExplanationMode?: SuggestionExplanationMode;
  /** When false, server prompt forces suggestedDuration null (Iteration 7). */
  allowRhythmInSuggestions?: boolean;
  /** When false, omit harmonic-alternatives block from the Stylist prompt. */
  includeHarmonicAlternatives?: boolean;
}

/**
 * POST /api/theory-inspector/suggest
 *
 * Returns structured score corrections from the Stylist AI.
 * Uses LangChain withStructuredOutput for validated JSON responses.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as SuggestRequestBody;
  const { genre, violationType, violationContext, scoreContext } = body;

  if (!genre || !scoreContext || scoreContext.length === 0) {
    return NextResponse.json(
      { error: "Missing required fields: genre, scoreContext" },
      { status: 400 },
    );
  }

  const { apiKey, model } = getServerOpenAIEnv();

  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key configured. Structured suggestions require an active LLM connection." },
      { status: 503 },
    );
  }

  const suggestionExplanationMode: SuggestionExplanationMode =
    isSuggestionExplanationMode(body.suggestionExplanationMode)
      ? body.suggestionExplanationMode
      : "full";

  const taxonomySection = getTaxonomyContext(genre, violationType);

  const allowRhythmInSuggestions = body.allowRhythmInSuggestions === true;
  const includeHarmonicAlternatives = body.includeHarmonicAlternatives !== false;

  const systemPrompt = buildStylistStructuredPrompt({
    genre,
    taxonomySection,
    violationType,
    violationContext,
    scoreContext,
    suggestionExplanationMode,
    allowRhythmInSuggestions,
    includeHarmonicAlternatives,
  });

  const messages = [
    {
      role: "user" as const,
      content: body.userMessage ?? "Suggest corrections to resolve the detected violations.",
    },
  ];

  try {
    const result: SuggestResponse = await structuredCompletion(
      apiKey,
      model,
      systemPrompt,
      messages,
      suggestResponseSchema,
      "suggest_corrections",
    );

    // Filter out corrections with invalid "note_X" indices
    const validCorrections = result.corrections.filter((c) => {
      const match = c.noteId.match(/^note_(\d+)$/);
      if (!match) return false;
      const idx = parseInt(match[1], 10);
      return idx >= 0 && idx < scoreContext.length;
    });

    const stripped =
      suggestionExplanationMode === "minimal"
        ? {
            corrections: validCorrections.map((c) => ({
              ...c,
              rationale: "",
            })),
            summary: "",
          }
        : { corrections: validCorrections, summary: result.summary };

    return NextResponse.json(stripped);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Suggestion request failed: ${message}` },
      { status: 502 },
    );
  }
}
