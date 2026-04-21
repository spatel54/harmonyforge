"use client";

/**
 * Loads Fontshare Satoshi without blocking first paint: the stylesheet is fetched
 * as `media="print"` (non-render-blocking), then applied to all media once loaded.
 */
export function NonBlockingFontshareLink() {
  return (
    <link
      rel="stylesheet"
      href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500&display=swap"
      media="print"
      onLoad={(e) => {
        (e.currentTarget as HTMLLinkElement).media = "all";
      }}
    />
  );
}
