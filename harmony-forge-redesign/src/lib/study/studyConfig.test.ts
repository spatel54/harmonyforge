import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  syncStudySessionFromUrl,
  getStudyCondition,
  getSuggestionExplanationMode,
  STUDY_CONDITION_STORAGE_KEY,
  SUGGESTION_EXPLANATION_STORAGE_KEY,
  isStudyCondition,
  isSuggestionExplanationMode,
} from "./studyConfig";

function createMemoryStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
  } as Storage;
}

describe("studyConfig", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("isStudyCondition validates literals", () => {
    expect(isStudyCondition("reviewer_primary")).toBe(true);
    expect(isStudyCondition("generator_primary")).toBe(true);
    expect(isStudyCondition("nope")).toBe(false);
  });

  it("isSuggestionExplanationMode validates literals", () => {
    expect(isSuggestionExplanationMode("minimal")).toBe(true);
    expect(isSuggestionExplanationMode("full")).toBe(true);
    expect(isSuggestionExplanationMode("")).toBe(false);
  });

  it("syncStudySessionFromUrl persists study and hfExplain", () => {
    syncStudySessionFromUrl("?study=reviewer_primary&hfExplain=minimal");
    expect(sessionStorage.getItem(STUDY_CONDITION_STORAGE_KEY)).toBe(
      "reviewer_primary",
    );
    expect(sessionStorage.getItem(SUGGESTION_EXPLANATION_STORAGE_KEY)).toBe(
      "minimal",
    );
  });

  it("getStudyCondition defaults to generator_primary", () => {
    expect(getStudyCondition()).toBe("generator_primary");
  });

  it("getStudyCondition reads sessionStorage after sync", () => {
    syncStudySessionFromUrl("?study=reviewer_primary");
    expect(getStudyCondition()).toBe("reviewer_primary");
  });

  it("getSuggestionExplanationMode defaults to full", () => {
    expect(getSuggestionExplanationMode()).toBe("full");
  });

  it("getSuggestionExplanationMode reads sessionStorage after sync", () => {
    syncStudySessionFromUrl("?hfExplain=minimal");
    expect(getSuggestionExplanationMode()).toBe("minimal");
  });
});
