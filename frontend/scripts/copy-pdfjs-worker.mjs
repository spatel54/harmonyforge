#!/usr/bin/env node
/**
 * Copy pdfjs-dist's worker file into public/pdfjs so Next.js can serve it as a
 * same-origin static asset. Keeps the worker version in lock-step with the
 * installed `pdfjs-dist` and avoids Turbopack's stricter URL-import rules.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = dirname(scriptDir);
const src = join(
  frontendDir,
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.mjs",
);
const dest = join(frontendDir, "public", "pdfjs", "pdf.worker.mjs");

if (!existsSync(src)) {
  console.warn(`[copy-pdfjs-worker] missing source: ${src} (skip)`);
  process.exit(0);
}
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-pdfjs-worker] copied → ${dest}`);
