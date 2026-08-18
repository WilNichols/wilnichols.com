import fs from "node:fs";

/**
 * Alt text for photos, keyed by the same full CDN URL that keys
 * collections.photos. It lives in the vault (`.photo-alt.json`) because that
 * is where it is authored, and alt belongs to the photo rather than to any one
 * album's use of it — the same image described once applies everywhere.
 *
 * An inline `![alt](url)` still wins; this is only the fallback.
 */
const SOURCE = "vault/.photo-alt.json";

export default function () {
  if (!fs.existsSync(SOURCE)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    // A broken alt map should not take the build down; images just fall back.
    console.warn(`[photoAlt] ignoring ${SOURCE}: ${e.message}`);
    return {};
  }
}
