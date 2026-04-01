# ADR 002: M4 MVP Completion Strategy

## Status

Accepted (2026-03-23)

## Context

Milestone 4 issue `#79` required finishing MVP-critical UX behaviors:

1. Reliable sandbox playback
2. First-time onboarding across the 3-step flow
3. Theory Inspector wiring without blocking on API key availability

The project needed a practical implementation that ships this week and still supports future expansion.

## Decision

1. **Playback path**
   - Keep `Tone.js` playback in frontend (`usePlayback`, `playbackUtils`).
   - Make scheduling rest-aware and measure-aware (time signature support).
   - Use PolySynth + transport cancellation before replay to reduce runtime timing failures.

2. **Onboarding path**
   - Add lightweight in-app coachmarks for `/`, `/document`, `/sandbox`.
   - Persist completion with `localStorage` (`harmonyforge-onboarding-v1-complete`).
   - Allow skip at every step to preserve user agency.

3. **Theory Inspector path**
   - Add app API route: `POST /api/theory-inspector`.
   - Route includes backend validation context when MusicXML is available.
   - Route uses OpenAI only if `OPENAI_API_KEY` exists; otherwise returns deterministic fallback guidance.

## Consequences

- MVP work no longer blocked by API key provisioning.
- User experience is stable enough for milestone transition to M5 user studies.
- Inspector architecture is now incrementally extensible (future Stylist edit-application and fuller RAG orchestration).
