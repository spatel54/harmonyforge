"use client";

import dynamic from "next/dynamic";

/** Code-splits the large tour overlay so the initial route JS stays smaller. */
const CoachmarkOverlay = dynamic(
  () =>
    import("@/components/organisms/CoachmarkOverlay").then(
      (m) => m.CoachmarkOverlay,
    ),
  { ssr: false, loading: () => null },
);

export function CoachmarkOverlayLazy() {
  return <CoachmarkOverlay />;
}
