/**
 * After async work, wait until at least `minMs` have passed since `start` (Date.now()).
 * Used so transition overlays stay on screen long enough for branded loaders + percent counter.
 */
export async function awaitMinElapsedSince(
  start: number,
  minMs: number,
): Promise<void> {
  const remaining = minMs - (Date.now() - start);
  if (remaining > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, remaining));
  }
}
