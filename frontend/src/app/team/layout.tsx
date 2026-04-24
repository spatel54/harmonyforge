import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Team — HarmonyForge",
  description:
    "Meet the builders behind HarmonyForge—full-stack engineers blending deterministic harmony, notation UX, and Glass Box pedagogy. Credits, stack, and how we work.",
  openGraph: {
    title: "Team — HarmonyForge",
    description:
      "The people and tools behind HarmonyForge: SATB engine, RiffScore, Theory Inspector, and a wholesome mission for explainable arrangement.",
    type: "website",
  },
};

/**
 * Root `main` is `h-full` with `body` `overflow-hidden`, so tall pages must
 * establish their own vertical scroll (see Playground / Document patterns).
 */
export default function TeamLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
      {children}
    </div>
  );
}
