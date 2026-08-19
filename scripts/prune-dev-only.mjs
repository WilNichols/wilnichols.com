/* Production only. Removes assets owned by posts production does not publish.
   develop.wilnichols.com builds with ELEVENTY_ENV=dev, so it keeps them. */
import { pruneUnpublishedAssets } from "../lib/dev-only-assets.js";

if (process.env.ELEVENTY_ENV !== "prod") {
  console.log("[dev-only-assets] not a production build, keeping everything");
  process.exit(0);
}
pruneUnpublishedAssets({ outputDir: "_site", vaultRoot: "vault" });
