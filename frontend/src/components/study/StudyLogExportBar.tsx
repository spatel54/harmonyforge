"use client";

import React from "react";
import {
  exportStudyEventLogJson,
  isStudyLoggingOptedIn,
  setStudyLoggingOptIn,
} from "@/lib/study/studyEventLog";
import { isStudySessionActive } from "@/lib/study/studyConfig";

/**
 * Sandbox footer strip: opt in/out and copy JSON export for researchers.
 */
export function StudyLogExportBar() {
  const [optIn, setOptIn] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const active = isStudySessionActive();

  React.useEffect(() => {
    setOptIn(isStudyLoggingOptedIn());
  }, []);

  if (!active && !optIn) {
    return null;
  }

  const copy = async () => {
    const json = exportStudyEventLogJson();
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="hf-print-hide flex flex-wrap items-center gap-2 font-mono text-[10px]"
      style={{
        color: "var(--hf-text-secondary)",
      }}
    >
      <span className="uppercase tracking-wide opacity-80">Research log</span>
      <label className="inline-flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => {
            setStudyLoggingOptIn(e.target.checked);
            setOptIn(e.target.checked);
          }}
        />
        Record events
      </label>
      <button
        type="button"
        disabled={!optIn}
        onClick={copy}
        className="underline disabled:opacity-40 disabled:no-underline"
        style={{ color: "var(--hf-accent)" }}
      >
        {copied ? "Copied" : "Copy JSON"}
      </button>
    </div>
  );
}
