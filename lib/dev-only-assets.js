/* Assets belonging to an unpublished post must not reach production.

   Pages are already handled: the `drafts` preprocessor drops a `draft: true` post
   in production, and `private: true` drops one everywhere. Passthrough copies are
   not, because `addPassthroughCopy` copies a directory wholesale and knows nothing
   about which post owns what. So a draft pen's embed would ship to
   wilnichols.com even though nothing links to it.

   This reads the notes, works out which asset directories belong to a post that
   will not be published, and reports them so the production build can leave them
   out. develop.wilnichols.com runs the dev build, so it keeps them.

   Ownership is by name: an embed directory is owned by the note whose `hero:`
   points at it. That is the same string the note already writes, so there is no
   second place to keep in sync. */

import fs from "node:fs";
import path from "node:path";

const VAULT_DIRS = ["Pens", "Work/Case Studies", "Entries", "Recipes", "Links", "Locations"];

/** Frontmatter as raw text, without pulling in a YAML parser. */
function frontmatter(file) {
  const s = fs.readFileSync(file, "utf8");
  if (!s.startsWith("---")) return "";
  const end = s.indexOf("\n---", 3);
  return end === -1 ? "" : s.slice(3, end);
}

/**
 * Embed slugs owned by a post that production will not publish.
 * @param {string} vaultRoot the vault directory, usually `<repo>/vault`
 */
export function unpublishedEmbedSlugs(vaultRoot) {
  const slugs = new Set();
  for (const dir of VAULT_DIRS) {
    const full = path.join(vaultRoot, dir);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full)) {
      if (!name.endsWith(".md")) continue;
      const fm = frontmatter(path.join(full, name));
      const unpublished = /^\s*(draft|private):\s*true\s*$/m.test(fm);
      if (!unpublished) continue;
      // `hero: /assets/embeds/<slug>/` is the only asset a post claims by name
      const hero = fm.match(/^\s*hero:\s*(\S+)\s*$/m);
      if (hero) {
        const slug = hero[1].replace(/^\/+|\/+$/g, "").split("/").pop();
        if (slug) slugs.add(slug);
      }
    }
  }
  return slugs;
}

/** Remove those directories from a finished production build. */
export function pruneUnpublishedAssets({ outputDir, vaultRoot, log = console.log }) {
  const slugs = unpublishedEmbedSlugs(vaultRoot);
  if (!slugs.size) { log("[dev-only-assets] nothing to prune"); return []; }
  const removed = [];
  for (const slug of slugs) {
    const dir = path.join(outputDir, "assets", "embeds", slug);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      removed.push(`assets/embeds/${slug}`);
    }
  }
  log(`[dev-only-assets] pruned ${removed.length}: ${removed.join(", ") || "none present"}`);
  return removed;
}
