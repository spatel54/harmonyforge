/**
 * Tests for the remote OMR boundary: capability minting (app side) and the
 * document parser that consumes sidecar output.
 *
 * The verification logic asserted here is reimplemented independently of
 * `services/omr/server.mjs` on purpose — if the two drift, these fail, which is
 * exactly the signal we want for a cross-service contract.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { getOmrServiceConfig, mintOmrGrant } from "./omrService";
import { parseRemoteOmrDocuments } from "./engine/parsers/audiverisPipeline";

const SECRET = "test-shared-secret";

/** Mirror of verifyGrant() in services/omr/server.mjs. */
function verifyGrant(token: string, secret: string, now = Date.now()) {
  const dot = token.indexOf(".");
  if (dot < 1) return { ok: false, reason: "malformed token" };
  const payloadPart = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);

  const expected = createHmac("sha256", secret).update(payloadPart).digest();
  const given = Buffer.from(sigPart, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "bad signature" };
  }
  const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf-8"));
  if (typeof payload?.exp !== "number" || now > payload.exp) {
    return { ok: false, reason: "token expired" };
  }
  return { ok: true };
}

const MINIMAL_SCORE = `<?xml version="1.0"?>
<score-partwise version="2.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration></note>
    </measure>
  </part>
</score-partwise>`;

describe("getOmrServiceConfig", () => {
  const original = { url: process.env.OMR_SERVICE_URL, secret: process.env.OMR_SHARED_SECRET };

  afterEach(() => {
    process.env.OMR_SERVICE_URL = original.url;
    process.env.OMR_SHARED_SECRET = original.secret;
  });

  it("returns null when unconfigured (symbolic intake still works)", () => {
    delete process.env.OMR_SERVICE_URL;
    delete process.env.OMR_SHARED_SECRET;
    expect(getOmrServiceConfig()).toBeNull();
  });

  it("returns null when only one half is set", () => {
    process.env.OMR_SERVICE_URL = "https://omr.example.run.app";
    delete process.env.OMR_SHARED_SECRET;
    expect(getOmrServiceConfig()).toBeNull();
  });

  it("strips trailing slashes so URL joins cannot double up", () => {
    process.env.OMR_SERVICE_URL = "https://omr.example.run.app///";
    process.env.OMR_SHARED_SECRET = SECRET;
    expect(getOmrServiceConfig()?.url).toBe("https://omr.example.run.app");
  });
});

describe("mintOmrGrant", () => {
  const config = { url: "https://omr.example.run.app", secret: SECRET };

  it("mints a token the sidecar accepts", () => {
    const grant = mintOmrGrant(config);
    expect(verifyGrant(grant.token, SECRET).ok).toBe(true);
  });

  it("rejects a token signed with a different secret", () => {
    const grant = mintOmrGrant(config);
    expect(verifyGrant(grant.token, "wrong-secret").ok).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const grant = mintOmrGrant(config);
    const [, signature] = grant.token.split(".");
    const forged = Buffer.from(JSON.stringify({ exp: Date.now() + 10_000_000 }), "utf-8")
      .toString("base64url");
    expect(verifyGrant(`${forged}.${signature}`, SECRET).ok).toBe(false);
  });

  it("expires — a grant is not a standing invitation", () => {
    const grant = mintOmrGrant(config, 1_000_000);
    expect(verifyGrant(grant.token, SECRET, 1_000_000 + 60_000).ok).toBe(true);
    expect(verifyGrant(grant.token, SECRET, grant.expiresAt + 1).ok).toBe(false);
  });

  it("does not leak the shared secret into the token", () => {
    expect(mintOmrGrant(config).token).not.toContain(SECRET);
  });
});

/** Mirror of isOriginAllowed() in services/omr/server.mjs. */
function originPatternToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[A-Za-z0-9-]+");
  return new RegExp(`^${escaped}$`);
}

function isOriginAllowed(origin: string, allowed: string[]): boolean {
  if (!origin) return false;
  for (const entry of allowed) {
    if (entry === origin) return true;
    if (!entry.includes("*")) continue;
    try {
      if (originPatternToRegExp(entry).test(origin)) return true;
    } catch {
      continue;
    }
  }
  return false;
}

describe("isOriginAllowed (sidecar CORS contract)", () => {
  const allowed = [
    "https://harmonyforge.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://harmonyforge-sjp10-9620s-projects.vercel.app",
    "https://harmonyforge-*-sjp10-9620s-projects.vercel.app",
  ];

  it("admits the exact production origin", () => {
    expect(isOriginAllowed("https://harmonyforge.vercel.app", allowed)).toBe(true);
  });

  it("admits localhost with its port", () => {
    expect(isOriginAllowed("http://localhost:3000", allowed)).toBe(true);
    expect(isOriginAllowed("http://localhost:9999", allowed)).toBe(false);
  });

  it("admits hashed and branch preview hostnames (which are flat, not subdomains)", () => {
    expect(
      isOriginAllowed("https://harmonyforge-eylkz49hj-sjp10-9620s-projects.vercel.app", allowed),
    ).toBe(true);
    expect(
      isOriginAllowed("https://harmonyforge-git-main-sjp10-9620s-projects.vercel.app", allowed),
    ).toBe(true);
  });

  it("REJECTS lookalikes a naive suffix match would admit", () => {
    expect(isOriginAllowed("https://evilsjp10-9620s-projects.vercel.app", allowed)).toBe(false);
    expect(isOriginAllowed("https://harmonyforge.vercel.app.evil.com", allowed)).toBe(false);
  });

  it("the glob never crosses a dot — no other Vercel app can match", () => {
    // If `*` matched dots, this attacker-controlled host would satisfy the
    // pattern by embedding the expected suffix after its own domain.
    expect(
      isOriginAllowed("https://harmonyforge-evil.attacker.com-sjp10-9620s-projects.vercel.app", allowed),
    ).toBe(false);
    expect(
      isOriginAllowed("https://harmonyforge-x.evil-sjp10-9620s-projects.vercel.app", allowed),
    ).toBe(false);
  });

  it("rejects a wrong scheme on an otherwise-matching host", () => {
    expect(
      isOriginAllowed("http://harmonyforge-abc-sjp10-9620s-projects.vercel.app", allowed),
    ).toBe(false);
  });

  it("rejects empty, garbage, and unlisted origins", () => {
    expect(isOriginAllowed("", allowed)).toBe(false);
    expect(isOriginAllowed("not-a-url", allowed)).toBe(false);
    expect(isOriginAllowed("https://evil.example", allowed)).toBe(false);
  });

  it("rejects everything when the allowlist is empty", () => {
    expect(isOriginAllowed("https://harmonyforge.vercel.app", [])).toBe(false);
  });
});

describe("parseRemoteOmrDocuments", () => {
  it("parses a MusicXML document returned by the sidecar", () => {
    const parsed = parseRemoteOmrDocuments([
      { name: "score.xml", data: Buffer.from(MINIMAL_SCORE, "utf-8") },
    ]);
    expect(parsed).not.toBeNull();
    expect(parsed!.melody.length).toBeGreaterThan(0);
  });

  it("returns null for an empty document list", () => {
    expect(parseRemoteOmrDocuments([])).toBeNull();
  });

  it("ignores documents whose extension is not .xml/.mxl", () => {
    expect(
      parseRemoteOmrDocuments([
        { name: "evil.sh", data: Buffer.from("#!/bin/sh\nrm -rf /", "utf-8") },
      ]),
    ).toBeNull();
  });

  it("strips path traversal from peer-supplied names", () => {
    // Honored as basename `score.xml`, so it still parses — the point is that
    // nothing is written outside the temp work dir.
    const parsed = parseRemoteOmrDocuments([
      { name: "../../../../tmp/score.xml", data: Buffer.from(MINIMAL_SCORE, "utf-8") },
    ]);
    expect(parsed).not.toBeNull();
  });

  it("returns null when the payload is not parseable notation", () => {
    expect(
      parseRemoteOmrDocuments([{ name: "junk.xml", data: Buffer.from("not xml at all", "utf-8") }]),
    ).toBeNull();
  });
});
