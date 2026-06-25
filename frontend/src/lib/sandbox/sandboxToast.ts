/** Shared bottom toast used on `/sandbox` (note explain + playback errors). */

export const HF_SANDBOX_TOAST_EVENT = "harmonyforge-sandbox-toast";

export type SandboxToastDetail = { message: string };

export function showSandboxToast(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SandboxToastDetail>(HF_SANDBOX_TOAST_EVENT, {
      detail: { message },
    }),
  );
}
