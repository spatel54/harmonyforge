import type { Metadata } from "next";

export const PRODUCT_NAME = "HarmonyForge";

/** Public site tagline — README-aligned; used in metadata and social cards. */
export const SITE_TAGLINE =
  "Glass Box harmony tools: rule-based SATB voicings you can edit, hear, and ask about—a visible engine, optional theory coach.";

export const COPYRIGHT_HOLDER = "Salt Family";

export function getCopyrightYear(): number {
  return new Date().getFullYear();
}

/** Full copyright line for Salt Family (UI + credits). */
export function getCopyrightNotice(): string {
  return `© ${getCopyrightYear()} ${COPYRIGHT_HOLDER}. All rights reserved.`;
}

export type OpenSourceNotice = {
  name: string;
  /** Upstream copyright line from the dependency’s LICENSE. */
  copyrightLine: string;
  license: string;
  packageUrl?: string;
};

/** Embedded or materially used libraries that ship notices in-app (RiffScore MIT). */
export const OPEN_SOURCE_NOTICES: OpenSourceNotice[] = [
  {
    name: "RiffScore",
    copyrightLine: "Copyright (c) 2025 Joseph Kotvas",
    license: "MIT",
    packageUrl: "https://github.com/joekotvas/RiffScore",
  },
];

export function buildRootMetadata(): Metadata {
  const title = `${PRODUCT_NAME} — Glass Box`;
  return {
    title,
    description: SITE_TAGLINE,
    applicationName: PRODUCT_NAME,
    authors: [{ name: COPYRIGHT_HOLDER }],
    openGraph: {
      title,
      description: SITE_TAGLINE,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description: SITE_TAGLINE,
    },
  };
}
