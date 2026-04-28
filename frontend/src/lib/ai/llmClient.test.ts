import { afterEach, describe, expect, it } from "vitest";

import {
  getServerOpenAIEnv,
  looksLikeOpenAIModelId,
  looksLikeOpenAISecretKey,
} from "./llmClient";

describe("looksLikeOpenAIModelId", () => {
  it("detects common OpenAI model ids", () => {
    expect(looksLikeOpenAIModelId("gpt-4o-mini")).toBe(true);
    expect(looksLikeOpenAIModelId("  gpt-5-nano ")).toBe(true);
    expect(looksLikeOpenAIModelId("o3-mini")).toBe(true);
  });

  it("rejects secrets and empty", () => {
    expect(looksLikeOpenAIModelId("sk-proj-abc")).toBe(false);
    expect(looksLikeOpenAIModelId("")).toBe(false);
  });
});

describe("looksLikeOpenAISecretKey", () => {
  it("accepts sk- prefixes with enough length", () => {
    expect(looksLikeOpenAISecretKey("sk-12345678901234567890")).toBe(true);
    expect(looksLikeOpenAISecretKey("sk-proj-123456789012345678901234")).toBe(true);
  });

  it("rejects short or non-sk values", () => {
    expect(looksLikeOpenAISecretKey("sk-short")).toBe(false);
    expect(looksLikeOpenAISecretKey("gpt-4o-mini")).toBe(false);
  });
});

describe("getServerOpenAIEnv", () => {
  const initialKey = process.env.OPENAI_API_KEY;
  const initialModel = process.env.OPENAI_MODEL;

  afterEach(() => {
    if (initialKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = initialKey;
    if (initialModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = initialModel;
  });

  it("swaps when model id is in OPENAI_API_KEY and sk- secret is in OPENAI_MODEL", () => {
    process.env.OPENAI_API_KEY = "gpt-4o-mini";
    process.env.OPENAI_MODEL = "sk-abcdefghijklmnopqrstuvwxyz12";
    const env = getServerOpenAIEnv();
    expect(env.apiKey).toBe("sk-abcdefghijklmnopqrstuvwxyz12");
    expect(env.model).toBe("gpt-4o-mini");
    expect(env.configHint).toMatch(/Recovered|swapped/i);
  });

  it("treats model-like OPENAI_API_KEY as missing key", () => {
    process.env.OPENAI_API_KEY = "gpt-4o-mini";
    delete process.env.OPENAI_MODEL;
    const env = getServerOpenAIEnv();
    expect(env.apiKey).toBeUndefined();
    expect(env.model).toBe("gpt-5-nano");
    expect(env.configHint).toMatch(/OPENAI_API_KEY looks like a model name/i);
  });

  it("leaves correct pairing unchanged", () => {
    process.env.OPENAI_API_KEY = "sk-abcdefghijklmnopqrstuvwxyz12";
    process.env.OPENAI_MODEL = "gpt-4o-mini";
    const env = getServerOpenAIEnv();
    expect(env.apiKey).toBe("sk-abcdefghijklmnopqrstuvwxyz12");
    expect(env.model).toBe("gpt-4o-mini");
    expect(env.configHint).toBeUndefined();
  });
});
