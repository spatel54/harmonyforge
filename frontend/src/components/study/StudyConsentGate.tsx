"use client";

import React from "react";
import {
  isStudyLoggingOptedIn,
  setStudyLoggingOptIn,
} from "@/lib/study/studyEventLog";

const REQUIRES_CONSENT =
  process.env.NEXT_PUBLIC_HF_STUDY_REQUIRES_CONSENT === "true";

/**
 * When NEXT_PUBLIC_HF_STUDY_REQUIRES_CONSENT=true, blocks the app until the
 * participant acknowledges research logging (opt-in to local event capture).
 */
export function StudyConsentGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(!REQUIRES_CONSENT);
  const [declined, setDeclined] = React.useState(false);

  React.useEffect(() => {
    if (!REQUIRES_CONSENT) return;
    if (isStudyLoggingOptedIn()) setReady(true);
  }, []);

  if (!REQUIRES_CONSENT) {
    return <>{children}</>;
  }

  if (ready) {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed inset-0 z-[11000] flex items-center justify-center px-6"
      style={{ backgroundColor: "color-mix(in srgb, var(--hf-bg) 92%, black)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-consent-title"
    >
      <div
        className="max-w-md w-full rounded-lg border p-6 shadow-xl"
        style={{
          backgroundColor: "var(--hf-panel-bg)",
          borderColor: "var(--hf-detail)",
        }}
      >
        <h2
          id="study-consent-title"
          className="font-brand text-xl mb-3"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Research session
        </h2>
        <p
          className="font-body text-sm leading-relaxed mb-4"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          This build may record anonymous interaction events (e.g. button
          clicks, suggestion accept/reject, tutor idea actions) on this device
          only, for research.
          No score contents or audio are uploaded by this log. You can export
          or discard the log at the end of the session.
        </p>
        {declined && (
          <p
            className="font-mono text-[11px] mb-3 text-amber-200/90"
            role="status"
          >
            Continuing without logging. The app works normally; researchers will
            not receive interaction data from this browser unless you opt in
            later from the sandbox.
          </p>
        )}
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-md font-mono text-xs border transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--hf-detail)",
              color: "var(--hf-text-primary)",
            }}
            onClick={() => {
              setStudyLoggingOptIn(false);
              setDeclined(true);
              setReady(true);
            }}
          >
            Continue without logging
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md font-mono text-xs font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--hf-accent)",
              color: "#1a0f0c",
            }}
            onClick={() => {
              setStudyLoggingOptIn(true);
              setReady(true);
            }}
          >
            Accept &amp; enable logging
          </button>
        </div>
      </div>
    </div>
  );
}
