import { useEffect } from "react";

// Inject a Google Fonts stylesheet <link> into <head> for the given URL.
// Safe to call with the same URL from multiple components — it de-dupes.
export function useGoogleFont(url) {
  useEffect(() => {
    if (!url || typeof url !== "string" || !url.startsWith("http")) return;

    const existing = document.querySelector(`link[data-google-font="${url}"]`);
    if (existing) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.setAttribute("data-google-font", url);
    document.head.appendChild(link);
    // Leave the link in place — fonts may be shared across views.
  }, [url]);
}
