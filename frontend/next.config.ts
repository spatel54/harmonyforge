import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { execFileSync } from "child_process";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// #region agent log
(() => {
  const git: { ok?: boolean; head?: string; err?: string } = {};
  try {
    git.ok = true;
    git.head = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      cwd: appDir,
    }).trim();
  } catch (e) {
    git.ok = false;
    git.err = e instanceof Error ? e.message : String(e);
  }
  let canvas = "untested";
  try {
    require("@napi-rs/canvas");
    canvas = "ok";
  } catch (e) {
    canvas = e instanceof Error ? e.message : String(e);
  }
  fetch("http://127.0.0.1:7406/ingest/555ec36b-f260-4597-b685-d87aa80b5dde", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "73a776",
    },
    body: JSON.stringify({
      sessionId: "73a776",
      runId: "post-fix",
      hypothesisId: "A",
      location: "next.config.ts:boot",
      message: "next config load",
      data: {
        cwd: process.cwd(),
        appDir,
        node: process.version,
        platform: process.platform,
        ci: process.env.CI ?? null,
        git,
        canvas: canvas.slice(0, 240),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
})();
// #endregion

// Monorepo has two package-lock.json files; Turbopack may infer the repo root and
// skip this app’s .env.local. Loading env from this directory fixes OPENAI_* (e.g.
// OPENAI_API_KEY, OPENAI_BASE_URL) without setting turbopack.root (which breaks
// tailwindcss resolution from @import).
loadEnvConfig(appDir);

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: [
    "@tonejs/midi",
    "@napi-rs/canvas",
    "adm-zip",
    "fast-xml-parser",
    "musicxml-interfaces",
    "pdfjs-dist",
  ],
};

export default nextConfig;
