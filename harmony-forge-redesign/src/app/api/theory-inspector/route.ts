import { NextResponse } from "next/server";

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

interface InspectorRequestBody {
  query?: string;
  musicXML?: string | null;
}

interface ValidationResponse {
  valid: boolean;
  her: number;
  totalSlots: number;
  violations: unknown;
}

interface InspectorHighlight {
  measureIndex: number;
  color: "red" | "blue";
  label?: string;
}

function countMeasures(musicXML?: string | null): number {
  if (!musicXML) return 0;
  const matches = musicXML.match(/<\s*measure\b/gi);
  return matches?.length ?? 0;
}

function fallbackReply(query: string, validation: ValidationResponse | null): string {
  const q = query.toLowerCase();
  const violationCount = getViolationCount(validation);
  const her = validation?.her ?? 1;

  if (q.includes("parallel")) {
    return `I found ${violationCount} flagged voice-leading issue(s). Parallel fifths/octaves typically reduce contrapuntal independence. Try contrary or oblique motion in one voice while keeping the harmonic function intact.`;
  }
  if (q.includes("fix") || q.includes("correct")) {
    return `Suggested workflow: identify the flagged interval, keep the bass harmonic anchor, and move the upper voice by step to avoid direct parallels. Current HER is ${her.toFixed(2)}.`;
  }
  if (q.includes("why")) {
    return `Theory Inspector is in fallback mode (no API key), but the rule-of-thumb still applies: preserve independent melodic contour between voices, especially around cadences.`;
  }
  return `I can explain and suggest fixes. Current harmony quality estimate (HER): ${her.toFixed(2)} with ${violationCount} violation(s). Ask “why is this flagged?” or “suggest a fix for measure X.”`;
}

function getViolationCount(validation: ValidationResponse | null): number {
  if (!validation) return 0;
  const violations = validation.violations;
  if (Array.isArray(violations)) return violations.length;
  if (violations && typeof violations === "object") {
    return Object.values(violations).reduce((sum, v) => {
      return sum + (typeof v === "number" ? v : 0);
    }, 0);
  }
  return 0;
}

function fallbackHighlights(
  query: string,
  validation: ValidationResponse | null,
  musicXML?: string | null,
): InspectorHighlight[] {
  const totalMeasures = Math.max(1, countMeasures(musicXML));
  const violationCount = getViolationCount(validation);
  if (violationCount === 0) {
    return [{ measureIndex: 0, color: "blue", label: "Stable opening" }];
  }
  const highlights: InspectorHighlight[] = [];
  const span = Math.min(4, violationCount + 1);
  for (let i = 0; i < span; i++) {
    highlights.push({
      measureIndex: Math.min(totalMeasures - 1, i),
      color: i < 2 ? "red" : "blue",
      label:
        i === 0
          ? "Likely issue focus"
          : i === 1
            ? "Secondary issue"
            : `Context (${query.slice(0, 24)})`,
    });
  }
  return highlights;
}

async function validateWithBackend(musicXML: string): Promise<ValidationResponse | null> {
  const formData = new FormData();
  const xmlBlob = new Blob([musicXML], { type: "application/xml" });
  formData.append("file", xmlBlob, "score.xml");

  const response = await fetch(`${BACKEND_API_BASE}/api/validate-from-file`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) return null;
  return (await response.json()) as ValidationResponse;
}

async function openAIReply(query: string, validation: ValidationResponse | null): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;

  const validationSummary = validation
    ? `Validation context: HER=${validation.her.toFixed(3)}, totalSlots=${validation.totalSlots}, violations=${getViolationCount(validation)}.`
    : "Validation context unavailable.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are HarmonyForge Theory Inspector. Be concise, deterministic, and educational. Explain and suggest, but do not auto-apply edits. Maintain user sovereignty.",
        },
        {
          role: "system",
          content: validationSummary,
        },
        {
          role: "user",
          content: query,
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

async function openAIHighlights(
  query: string,
  validation: ValidationResponse | null,
  musicXML?: string | null,
): Promise<InspectorHighlight[] | null> {
  if (!OPENAI_API_KEY) return null;
  const totalMeasures = Math.max(1, countMeasures(musicXML));
  const violationCount = getViolationCount(validation);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "Return only valid JSON. Schema: {\"highlights\":[{\"measureIndex\":number,\"color\":\"red\"|\"blue\",\"label\":string}]}.",
        },
        {
          role: "user",
          content: `Pick up to 4 measure highlights for a SATB score using query="${query}", totalMeasures=${totalMeasures}, violationCount=${violationCount}. Use red for likely violations and blue for context.`,
        },
      ],
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as {
      highlights?: Array<{
        measureIndex?: number;
        color?: string;
        label?: string;
      }>;
    };
    if (!Array.isArray(parsed.highlights)) return null;
    return parsed.highlights
      .map((h): InspectorHighlight | null => {
        if (typeof h.measureIndex !== "number") return null;
        if (h.color !== "red" && h.color !== "blue") return null;
        return {
          measureIndex: Math.max(
            0,
            Math.min(totalMeasures - 1, Math.floor(h.measureIndex)),
          ),
          color: h.color,
          label: typeof h.label === "string" ? h.label : undefined,
        };
      })
      .filter((h): h is InspectorHighlight => h !== null);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InspectorRequestBody;
    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    let validation: ValidationResponse | null = null;
    if (body.musicXML) {
      try {
        validation = await validateWithBackend(body.musicXML);
      } catch {
        validation = null;
      }
    }

    let reply: string | null = null;
    try {
      reply = await openAIReply(query, validation);
    } catch {
      reply = null;
    }

    if (!reply) {
      reply = fallbackReply(query, validation);
    }

    let highlights: InspectorHighlight[] | null = null;
    try {
      highlights = await openAIHighlights(query, validation, body.musicXML);
    } catch {
      highlights = null;
    }
    if (!highlights || highlights.length === 0) {
      highlights = fallbackHighlights(query, validation, body.musicXML);
    }

    return NextResponse.json({
      reply,
      validation,
      highlights,
      mode: OPENAI_API_KEY ? "llm" : "fallback",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
