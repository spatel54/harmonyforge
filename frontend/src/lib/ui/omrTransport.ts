/**
 * Which path a PDF/image upload takes to become MusicXML.
 *
 *   "local"  — Audiveris on the server host (dev machine, all-in-one Docker image)
 *   "remote" — the Cloud Run OMR sidecar (serverless deployments)
 *   "none"   — OMR unavailable; MusicXML/MXL/MIDI still work
 *
 * Reported by GET /api/health as `omr.transport`.
 */
export type OmrTransport = "local" | "remote" | "none";
