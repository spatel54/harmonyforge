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

const BRAND = {
  ogImage: "/brand/og-image.png",
  ogImageDark: "/brand/og-image-dark.png",
  twitterCard: "/brand/twitter-card.png",
  favicon16: "/brand/favicon-16x16.png",
  favicon32: "/brand/favicon-32x32.png",
  appleTouchIcon: "/brand/apple-touch-icon.png",
} as const;

export function buildRootMetadata(): Metadata {
  const title = `${PRODUCT_NAME} — Glass Box`;
  return {
    title,
    description: SITE_TAGLINE,
    applicationName: PRODUCT_NAME,
    authors: [{ name: COPYRIGHT_HOLDER }],
    icons: {
      icon: [
        { url: BRAND.favicon16, sizes: "16x16", type: "image/png" },
        { url: BRAND.favicon32, sizes: "32x32", type: "image/png" },
      ],
      apple: BRAND.appleTouchIcon,
    },
    openGraph: {
      title,
      description: SITE_TAGLINE,
      type: "website",
      images: [
        {
          url: BRAND.ogImage,
          width: 1200,
          height: 630,
          alt: `${PRODUCT_NAME} — Glass Box harmony tools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_TAGLINE,
      images: [BRAND.twitterCard],
    },
  };
}
