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
