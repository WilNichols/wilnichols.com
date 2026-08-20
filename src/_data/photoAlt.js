import fs from "node:fs";

/* Alt text keyed by full CDN URL, authored in the vault (.photo-alt.json).
   Alt belongs to the photo, not to one album's use of it. An inline
   ![alt](url) still wins; this is the fallback. */
const SOURCE = "vault/.photo-alt.json";

export default function () {
  if (!fs.existsSync(SOURCE)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    /* A broken alt map should not fail the build. */
    console.warn(`[photoAlt] ignoring ${SOURCE}: ${e.message}`);
    return {};
  }
}
