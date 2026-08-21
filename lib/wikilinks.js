/* Resolves Obsidian wikilinks against the pages the build actually produces.

   The old rule slugified the link text and hoped: `[[Imposter Syndrome]]` became
   `/imposter-syndrome/` whether or not anything was published there. Two things
   make that guess wrong often enough to matter. Notes carry a `permalink:` key
   that overrides the routed URL — `The Personal Agency Fallacy` ships as
   `/personal-agency/` — and a vault link is just as likely to point at a folder
   note, a private note or a draft, none of which have a URL at all. Both cases
   emitted a 404 with no sign at build time.

   So the index is keyed on note identity and holds the real output URL. Links
   arrive in both forms Obsidian writes, `[[Imposter Syndrome]]` and
   `[[Entries/Imposter Syndrome]]`, so every trailing path suffix is registered:
   a note at `Photography/Albums/Lyon 1` answers to that, to `Albums/Lyon 1`, and
   to `Lyon 1`. */

import fs from "node:fs";
import path from "node:path";

/* A note is written without its extension; a template that produces a page is
   registered without one either, so `[[Work]]` can reach `src/Work/work.njk`. */
const PAGE_EXTENSION = /\.(md|markdown|njk|liquid|html|11ty\.js)$/i;

/* Keys are compared loosely, the way Obsidian itself resolves a link: case and
   surrounding whitespace are not significant, and the curly apostrophe Obsidian
   substitutes while typing has to match the straight one a link was written
   with (`Iceland's Cities` and `Iceland’s Cities` are the same note). */
function normalizeKey(target) {
  return String(target)
    .trim()
    .replace(/^\.?\//, "")
    .replace(PAGE_EXTENSION, "")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/* A link may address a heading or a block: `[[Note#Heading]]`, `[[Note#^block]]`.
   Only the note half takes part in resolution; a heading becomes the fragment,
   and a block id has no counterpart in the output so it is dropped. */
function splitAnchor(target) {
  const hash = target.indexOf("#");
  if (hash === -1) return { note: target, fragment: "" };
  const anchor = target.slice(hash + 1).trim();
  return {
    note: target.slice(0, hash),
    fragment: anchor.startsWith("^") ? "" : anchor,
  };
}

/* Every trailing path suffix, longest first, so `Entries/Imposter Syndrome` and
   `Imposter Syndrome` both land on the same page. */
function keysFor(relativePath) {
  const segments = relativePath.replace(PAGE_EXTENSION, "").split("/").filter(Boolean);
  return segments.map((_, i) => normalizeKey(segments.slice(i).join("/")));
}

export class WikilinkIndex {
  constructor() {
    this.byKey = new Map();
    this.published = new Set();
    this.misses = new Map();
    this.ambiguous = new Map();
  }

  /* Populated from 11ty's `eleventy.contentMap` event, which fires after every
     permalink is computed and before the first template renders — the only
     window that works, since markdown-it runs during rendering. A collection
     would also be built in time, but collections drop anything carrying
     `eleventyExcludeFromCollections`, which is exactly what the test fixtures
     set, and the content map carries every template unconditionally. */
  load(inputPathToUrl, { inputDir = "src", vaultDir = "vault" } = {}) {
    this.byKey.clear();
    this.published.clear();
    const inputRoot = path.resolve(inputDir);
    const vaultPath = path.resolve(vaultDir);
    const vaultRoot = fs.existsSync(vaultPath) ? fs.realpathSync(vaultPath) : null;
    const byPath = [];
    const byUrl = [];

    for (const [inputPath, urls] of Object.entries(inputPathToUrl)) {
      /* `permalink: false` pages (work entries, sidecars) report no URL. They are
         real notes with no page, so leaving them out is what makes a link to one
         resolve as unlinked text rather than as a 404. */
      const all = (Array.isArray(urls) ? urls : [urls]).filter((u) => typeof u === "string" && u);
      /* A paginated template reports one URL per page. Resolution wants the first —
         a link to a paginated note means its front page — but every one of them is a
         real page, and the link checker has to know that or it calls them all dead. */
      for (const each of all) this.published.add(each);
      const url = all[0];
      if (!url) continue;

      /* The published folders reach the vault through symlinks, so the input path
         is `src/Notes/Entries/notes/…` while the link is written against the vault
         layout, `Entries/…`. Resolving the symlink is what reconciles the two. */
      const absolute = path.resolve(inputPath);
      let real = absolute;
      try { real = fs.realpathSync(absolute); } catch { /* deleted mid-watch */ }
      const relative = vaultRoot && real.startsWith(vaultRoot + path.sep)
        ? path.relative(vaultRoot, real)
        : path.relative(inputRoot, absolute);

      byPath.push([keysFor(relative), url, inputPath]);
      /* Some links are written against the published URL rather than the note
         name — `[[monthly-notes-no-1|bustling May]]` for a note filed as
         `Monthly Notes No. 1`. Registered in a second pass so a URL slug never
         shadows a note that genuinely carries that name. */
      byUrl.push([keysFor(url.replace(/\/index\.html$/, "")), url, inputPath]);
    }

    for (const [keys, url, inputPath] of [...byPath, ...byUrl]) {
      for (const key of keys) {
        const existing = this.byKey.get(key);
        if (existing && existing.url !== url) {
          /* Two pages answer to the same name. The deeper key still separates
             them, so the bare one keeps whichever the content map ordered first
             and records the rest — reported only if a link actually asks for it,
             since most name clashes are between pages nothing links to. */
          existing.alternates.push(url);
          continue;
        }
        if (!existing) this.byKey.set(key, { url, inputPath, alternates: [] });
      }
    }
    return this;
  }

  /* The URL for a link target, or null if nothing was published for it. Misses
     are counted so the build can report them; a wikilink is written by hand and
     a typo in one is otherwise invisible until someone clicks it. */
  resolve(target) {
    const { note, fragment } = splitAnchor(String(target));
    const hit = this.byKey.get(normalizeKey(note));
    if (!hit) {
      const label = normalizeKey(note);
      this.misses.set(label, (this.misses.get(label) ?? 0) + 1);
      return null;
    }
    if (hit.alternates.length) this.ambiguous.set(normalizeKey(note), hit);
    return fragment ? `${hit.url}#${fragment}` : hit.url;
  }

  /* Every URL the build published, whether or not a name resolves to it.
     lib/link-check.js checks hand-written links against this rather than crawling
     the input a second time. */
  urls() {
    return new Set(this.published);
  }

  report(log = console) {
    for (const [key, hit] of this.ambiguous) {
      log.warn(`[wikilinks] "${key}" names more than one page — linked to ${hit.url}, not ${hit.alternates.join(", ")}`);
    }
    if (this.misses.size === 0) return;
    const targets = [...this.misses.entries()].sort((a, b) => b[1] - a[1]);
    const total = targets.reduce((sum, [, count]) => sum + count, 0);
    log.warn(`[wikilinks] ${total} link(s) to ${targets.length} unpublished target(s), rendered as plain text:`);
    for (const [target, count] of targets) {
      log.warn(`  ${target}${count > 1 ? ` (×${count})` : ""}`);
    }
  }

  reset() {
    this.misses.clear();
    this.ambiguous.clear();
  }
}
