"use client";

import React from "react";
import { syncStudySessionFromUrl } from "@/lib/study/studyConfig";

/**
 * Syncs `?study=` and `?hfExplain=` into sessionStorage on first client mount.
 */
export function StudySessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    syncStudySessionFromUrl(window.location.search);
  }, []);
  return <>{children}</>;
}
