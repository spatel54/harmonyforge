"use client";

import React, { useRef } from "react";
import { syncStudySessionFromUrl } from "@/lib/study/studyConfig";

/**
 * Syncs `?study=` and `?hfExplain=` into sessionStorage on first client render.
 */
export function StudySessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const didSync = useRef(false);
  if (typeof window !== "undefined" && !didSync.current) {
    syncStudySessionFromUrl(window.location.search);
    didSync.current = true;
  }
  return <>{children}</>;
}
