import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

// Monorepo has two package-lock.json files; Turbopack may infer the repo root and
// skip this app’s .env.local. Loading env from this directory fixes OPENAI_API_KEY
// without setting turbopack.root (which breaks tailwindcss resolution from @import).
loadEnvConfig(appDir);

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
