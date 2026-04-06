/**
 * LangChain-based LLM client for Theory Inspector.
 * Server-side only — imported by the Next.js API route, never by client components.
 */

import { ChatOpenAI } from "@langchain/openai";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Strip a second `http(s)://…` accidentally pasted onto the first (e.g. …/v1https://…). */
function normalizeOpenAIBaseURL(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  const secondHttps = t.indexOf("https://", 8);
  if (secondHttps > 0) {
    return t.slice(0, secondHttps).trimEnd();
  }
  const secondHttp = t.indexOf("http://", 7);
  if (secondHttp > 0 && !t.slice(0, secondHttp).includes("https://")) {
    return t.slice(0, secondHttp).trimEnd();
  }
  return t;
}

function resolveOpenAIBaseURL(): string | undefined {
  const fromBase = process.env.OPENAI_BASE_URL?.trim();
  const fromUrl = process.env.OPENAI_URL?.trim();
  const chosen = fromBase || fromUrl;
  if (!chosen) return undefined;
  return normalizeOpenAIBaseURL(chosen);
}

function createModel(apiKey: string, model: string): ChatOpenAI {
  const baseURL = resolveOpenAIBaseURL();

  return new ChatOpenAI({
    model,
    maxTokens: 4096,
    streamUsage: false,
    configuration: {
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    },
  });
}

function toMessages(systemPrompt: string, messages: ChatMessage[]) {
  return [
    new SystemMessage(systemPrompt),
    ...messages.map((m) =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new AIMessage(m.content),
    ),
  ];
}

/**
 * Stream a chat completion via LangChain ChatOpenAI.
 * Returns a ReadableStream of text chunks (same contract as before).
 */
export async function streamChat(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const llm = createModel(apiKey, model);
  const lcMessages = toMessages(systemPrompt, messages);
  const stream = await llm.stream(lcMessages);
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await stream.next();
      if (done) {
        controller.close();
        return;
      }
      const text =
        typeof value.content === "string" ? value.content : "";
      if (text) {
        controller.enqueue(encoder.encode(text));
      }
    },
    cancel() {
      stream.return();
    },
  });
}

/**
 * Structured completion via LangChain withStructuredOutput.
 * Returns validated JSON matching the provided Zod schema.
 * Non-streaming (structured output requires complete response).
 */
export async function structuredCompletion<T>(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  schema: import("zod").ZodType<T>,
  schemaName: string,
): Promise<T> {
  const llm = createModel(apiKey, model);
  const structured = llm.withStructuredOutput(schema, { name: schemaName });
  const lcMessages = toMessages(systemPrompt, messages);
  return (await structured.invoke(lcMessages)) as T;
}

/**
 * Non-streaming chat completion (fallback).
 */
export async function chatCompletion(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
  const llm = createModel(apiKey, model);
  const lcMessages = toMessages(systemPrompt, messages);
  const result = await llm.invoke(lcMessages);
  return typeof result.content === "string" ? result.content : "";
}
