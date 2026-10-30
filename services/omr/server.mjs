/**
 * HarmonyForge OMR sidecar.
 *
 * Runs the Audiveris batch CLI and returns the symbolic documents it produced.
 * Deliberately does NOT parse or merge MusicXML — that stays in the Next.js app
 * (`parseAudiverisWorkDir` / `mergeParsedScores`) so there is exactly one
 * implementation of score parsing. This service's whole job is: bytes in,
 * MusicXML documents out.
 *
 * Endpoints
 *   GET  /health            → { ok, audiveris, java, ready }
 *   POST /convert?name=…    → { documents: [{ name, encoding: "base64", data }] }
 *
 * Auth: `Authorization: Bearer <grant>`, where the grant is minted by the Next
 * app (`/api/omr-grant`) and signed with the shared `OMR_SHARED_SECRET`. The
 * browser uploads here directly because Vercel caps function request bodies at
 * 4.5 MB while score uploads run to 25 MB.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const PORT = Number.parseInt(process.env.PORT ?? "8080", 10);
const SHARED_SECRET = process.env.OMR_SHARED_SECRET ?? "";
const ALLOWED_ORIGINS = (process.env.OMR_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Matches DEFAULT_AUDIVERIS_MS in the app. Cloud Run allows 60-minute requests. */
const AUDIVERIS_MS = Number.parseInt(process.env.HF_AUDIVERIS_MAX_MS ?? "900000", 10);
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MIN_JAVA_VERSION = 25;

const USE_COMPRESSION_FALSE =
  "org.audiveris.omr.sheet.BookManager.useCompression=false";
const USE_COMPRESSION_TRUE =
  "org.audiveris.omr.sheet.BookManager.useCompression=true";

/** Audiveris accepts these directly; anything else is rejected up front. */
const ACCEPTED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"]);

// ── Auth ────────────────────────────────────────────────────────────────────

/**
 * Grant format: `<base64url(payload)>.<base64url(hmac-sha256)>`
 * payload = { exp: <epoch ms> }. Kept trivial on purpose — it is a
 * short-lived "you may spend our CPU" capability, not a user identity.
 */
function verifyGrant(token) {
  if (!SHARED_SECRET) return { ok: false, reason: "service misconfigured: OMR_SHARED_SECRET unset" };
  if (!token) return { ok: false, reason: "missing bearer token" };

  const dot = token.indexOf(".");
  if (dot < 1) return { ok: false, reason: "malformed token" };

  const payloadPart = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);

  const expected = createHmac("sha256", SHARED_SECRET).update(payloadPart).digest();
  let given;
  try {
    given = Buffer.from(sigPart, "base64url");
  } catch {
    return { ok: false, reason: "malformed signature" };
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "bad signature" };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf-8"));
  } catch {
    return { ok: false, reason: "malformed payload" };
  }
  if (typeof payload?.exp !== "number" || Date.now() > payload.exp) {
    return { ok: false, reason: "token expired" };
  }
  return { ok: true };
}

// ── Audiveris ───────────────────────────────────────────────────────────────

function parseJavaMajorVersion(output) {
  const match = output.match(/version "(\d+)/);
  if (!match) return null;
  const major = Number.parseInt(match[1], 10);
  return Number.isFinite(major) ? major : null;
}

/**
 * Cloud Run throttles CPU outside request handling, so a `java -version` spawn
 * during container startup can exceed a short timeout and report a false
 * "java: not available". 30s is generous enough to survive that throttling;
 * during a real request CPU is allocated and this returns in milliseconds.
 */
const JAVA_PROBE_TIMEOUT_MS = 30_000;

function javaReady(details) {
  const javaBin = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, "bin", "java") : "java";
  const result = spawnSync(javaBin, ["-version"], {
    encoding: "utf-8",
    timeout: JAVA_PROBE_TIMEOUT_MS,
  });
  const output = [result.stderr, result.stdout].filter(Boolean).join("\n");
  if (result.error) {
    details.push(`java: could not run (${result.error.message})`);
    return false;
  }
  const major = parseJavaMajorVersion(output);
  if (major == null) {
    details.push("java: could not detect version");
    return false;
  }
  if (major < MIN_JAVA_VERSION) {
    details.push(`java: JDK ${MIN_JAVA_VERSION}+ required (found ${major})`);
    return false;
  }
  return true;
}

function omrStatus() {
  const details = [];
  const bin = process.env.AUDIVERIS_BIN ?? "";
  const audiveris = bin.length > 0 && existsSync(bin);
  if (!audiveris) details.push(`audiveris: binary not found at ${bin || "(unset)"}`);
  const java = javaReady(details);
  return { audiveris, java, ready: audiveris && java, details };
}

function runBatch(bin, args, timeoutMs, details, label) {
  const result = spawnSync(bin, args, {
    encoding: "utf-8",
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) {
    const timedOut = result.error.code === "ETIMEDOUT" || result.signal === "SIGTERM";
    details.push(
      timedOut
        ? `${label}: timed out after ${Math.round(timeoutMs / 1000)}s`
        : `${label}: ${result.error.message}`,
    );
    return false;
  }
  if (result.status !== 0) {
    const out = [result.stderr, result.stdout].filter(Boolean).join("\n").slice(-1800);
    details.push(`${label}: exited ${result.status}\n${out}`);
    return false;
  }
  return true;
}

/** Collect .mxl (preferred) or .xml, recursively, mirroring the app's logic. */
function collectScoreFiles(dir, ext) {
  const found = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (extname(entry.name).toLowerCase() === `.${ext}`) found.push(full);
    }
  };
  walk(dir);
  return found.sort();
}

/**
 * Two-phase batch, identical to `tryAudiverisOnInputFile` in the app:
 * import (uncompressed) → .omr book, then export (compressed) → .mxl.
 */
function convert(buffer, originalName) {
  const details = [];

  // Cheap input validation first: the readiness probe spawns `java -version`,
  // so a junk-extension flood must not be able to fork a process per request.
  const ext = extname(originalName).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.has(ext)) {
    return { ok: false, status: 415, details: [`unsupported extension: ${ext || "(none)"}`] };
  }

  const status = omrStatus();
  if (!status.ready) return { ok: false, status: 501, details: status.details };

  const workRoot = mkdtempSync(join(tmpdir(), "hf-omr-"));
  try {
    const baseName = "score";
    const inputPath = join(workRoot, `${baseName}${ext}`);
    writeFileSync(inputPath, buffer);

    const bookWork = join(workRoot, baseName);
    mkdirSync(bookWork, { recursive: true });

    const bin = process.env.AUDIVERIS_BIN;
    const phaseTimeoutMs = Math.max(60_000, Math.floor(AUDIVERIS_MS / 2));

    const importOk = runBatch(
      bin,
      ["-batch", "-export", "-save", "-output", bookWork,
       "-constant", USE_COMPRESSION_FALSE, inputPath],
      phaseTimeoutMs, details, "audiveris import",
    );
    if (!importOk) return { ok: false, status: 422, details };

    const omrFile = join(bookWork, `${baseName}.omr`);
    if (!existsSync(omrFile)) {
      details.push("audiveris: no .omr book produced after import");
      return { ok: false, status: 422, details };
    }

    const exportOk = runBatch(
      bin,
      ["-batch", "-export", "-output", bookWork,
       "-constant", USE_COMPRESSION_TRUE, omrFile],
      phaseTimeoutMs, details, "audiveris export",
    );
    if (!exportOk) return { ok: false, status: 422, details };

    const mxl = collectScoreFiles(bookWork, "mxl");
    const paths = mxl.length > 0 ? mxl : collectScoreFiles(bookWork, "xml");
    if (paths.length === 0) {
      details.push("audiveris: no MusicXML (.xml/.mxl) produced in output directory");
      return { ok: false, status: 422, details };
    }

    const documents = paths.map((p) => ({
      name: p.slice(bookWork.length + 1),
      encoding: "base64",
      data: readFileSync(p).toString("base64"),
    }));
    return { ok: true, documents };
  } finally {
    try {
      rmSync(workRoot, { recursive: true, force: true });
    } catch {
      // best effort — Cloud Run instances are ephemeral anyway
    }
  }
}

// ── HTTP ────────────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  // Explicit allowlist: this endpoint spends CPU, so it is never open to `*`.
  const allowed = origin && ALLOWED_ORIGINS.includes(origin);
  return allowed
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization,content-type",
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }
    : { Vary: "Origin" };
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    ...extraHeaders,
  });
  res.end(payload);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > limit) {
        reject(Object.assign(new Error("payload too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const cors = corsHeaders(origin);
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    const status = omrStatus();
    sendJson(res, status.ready ? 200 : 503, {
      ok: status.ready,
      audiveris: status.audiveris,
      java: status.java,
      ready: status.ready,
      details: status.details,
    }, cors);
    return;
  }

  if (req.method === "POST" && url.pathname === "/convert") {
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      sendJson(res, 403, { error: "origin not allowed" }, cors);
      return;
    }

    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    const grant = verifyGrant(token);
    if (!grant.ok) {
      sendJson(res, 401, { error: `unauthorized: ${grant.reason}` }, cors);
      return;
    }

    let buffer;
    try {
      buffer = await readBody(req, MAX_UPLOAD_BYTES);
    } catch (e) {
      sendJson(res, e?.statusCode === 413 ? 413 : 400,
        { error: e?.statusCode === 413 ? "file too large (max 25 MB)" : "could not read body" }, cors);
      return;
    }
    if (buffer.length === 0) {
      sendJson(res, 400, { error: "empty body" }, cors);
      return;
    }

    const name = url.searchParams.get("name") ?? "upload.pdf";
    const started = Date.now();
    let result;
    try {
      result = convert(buffer, name);
    } catch (e) {
      console.error("[omr] unexpected failure", e);
      sendJson(res, 500, { error: "internal error" }, cors);
      return;
    }
    const elapsed = Date.now() - started;

    if (!result.ok) {
      console.warn(`[omr] convert failed in ${elapsed}ms:`, result.details.join(" | "));
      sendJson(res, result.status, { error: result.details.join("\n") }, cors);
      return;
    }

    console.log(`[omr] converted ${name} in ${elapsed}ms → ${result.documents.length} document(s)`);
    sendJson(res, 200, { documents: result.documents, elapsedMs: elapsed }, cors);
    return;
  }

  sendJson(res, 404, { error: "not found" }, cors);
});

// Cloud Run sends SIGTERM before reclaiming an instance.
process.on("SIGTERM", () => server.close(() => process.exit(0)));

server.listen(PORT, "0.0.0.0", () => {
  const status = omrStatus();
  console.log(
    `[omr] listening on :${PORT} — audiveris=${status.audiveris} java=${status.java} ready=${status.ready}`,
  );
  if (!status.ready) console.warn(`[omr] NOT READY: ${status.details.join(" | ")}`);
  if (!SHARED_SECRET) console.warn("[omr] OMR_SHARED_SECRET is unset — /convert will reject everything");
  if (ALLOWED_ORIGINS.length === 0) console.warn("[omr] OMR_ALLOWED_ORIGINS is empty — browser calls will be refused");
});
