/* Reports hand-written internal links that point at no page.

   Wikilinks are already safe: they resolve through the index in lib/wikilinks.js
   and an unresolvable one renders as plain text and is logged. A markdown link is
   the hole that leaves. Nothing checks `[the entry](/staff-desiger/)`, so a typo,
   a renamed note or an album URL written without its group segment ships as a live
   anchor that answers 404, and the only way it surfaces is a reader clicking it.

   Anchors only. A stylesheet or an image that goes missing is loud in the browser
   and, in this build, is written by postcss after 11ty has already finished, so
   checking asset URLs here would only produce noise about files that do exist by
   the time the site is served.

   Not fatal by design. Reporting a link is enough to get it fixed, and a check
   that fails the build on prose is a check that gets disabled the first time a
   deploy is blocked by a typo in a recipe. */

import fs from "node:fs";
import path from "node:path";

/* `/notes`, `/notes/` and `/notes/index.html` are one page to the server, so
   every path is compared in one form. Case is significant: Netlify serves paths
   case-sensitively, which is the whole reason `/TODO/` is a dead link on a site
   that does publish lowercase slugs. */
function canonical(urlPath) {
  const trimmed = String(urlPath).replace(/\/index\.html?$/i, "/").replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/* A link written in Obsidian may arrive percent-encoded, since the vault escapes
   spaces and apostrophes on the way out, while the URLs 11ty reports never are. */
function decode(urlPath) {
  try { return decodeURI(urlPath); } catch { return urlPath; }
}

/* Netlify's `_redirects` is whitespace-separated, `from to [status]`, and a
   trailing `*` is a splat that matches any suffix. netlify.toml declares the same
   thing in TOML; today its rules are all host-level canonicalization, but they are
   parsed anyway so that a path rule added there is not mistaken for a dead link. */
function readRedirects(files) {
  const exact = new Set();
  const prefixes = [];
  const record = (from) => {
    /* Only path rules can rescue an internal link. A rule keyed on another host
       redirects that host's traffic, not a link inside a page on this one. */
    if (!from.startsWith("/")) return;
    if (from.endsWith("*")) prefixes.push(from.slice(0, -1));
    else exact.add(canonical(from));
  };

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (file.endsWith(".toml")) {
      for (const match of text.matchAll(/^\s*from\s*=\s*["']([^"']+)["']/gm)) record(match[1]);
      continue;
    }
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [from] = trimmed.split(/\s+/);
      if (from) record(from);
    }
  }
  return { exact, prefixes };
}

/* An `<a href>` in rendered HTML, quoted or bare. Parsing the whole document with
   node-html-parser would be tidier and roughly twenty times slower across a few
   hundred pages, and an attribute this shape does not need a tree to find. */
const ANCHOR_HREF = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;

export class LinkChecker {
  /* `hosts` are the site's own domains, so an absolute link somebody wrote as
     `https://wilnichols.com/notes/` is still checked rather than waved through as
     external. `passthrough` mirrors the `addPassthroughCopy` calls in the config as
     `[urlPrefix, sourcePath]` pairs: those files are copied, never rendered, so they
     are absent from the page index and have to be looked for on disk instead. */
  constructor({ hosts = [], passthrough = [], redirectFiles = [] } = {}) {
    this.hosts = hosts.map((host) => host.replace(/^www\./, ""));
    this.passthrough = passthrough;
    this.redirectFiles = redirectFiles;
    this.pages = new Set();
    this.redirects = { exact: new Set(), prefixes: [] };
    this.findings = new Map();
  }

  /* The page set comes from the wikilink index rather than from a second crawl of
     the input: it is already keyed on the URLs 11ty computed, and it is populated at
     `eleventy.contentMap`, early enough that a template can ask this checker about a
     link while it renders — which is how the src/test fixture exercises it. */
  load(urls) {
    this.pages = new Set([...urls].map((url) => canonical(decode(url))));
    this.redirects = readRedirects(this.redirectFiles);
    return this;
  }

  /* Why a link is not a problem, or `dead` when it is. Reported as a word rather
     than a boolean because the fixture asserts on the reason, and "this resolves
     because a redirect covers it" is a different claim from "a page is there". */
  classify(href, fromUrl = "/") {
    const raw = String(href ?? "").trim();
    if (!raw || raw.startsWith("#")) return "fragment";

    /* Anything carrying a scheme or a protocol-relative host: external unless the
       host is ours. `mailto:` and `tel:` land here too, which is where they belong. */
    if (/^(?:[a-z][a-z0-9+.\-]*:|\/\/)/i.test(raw)) {
      let absolute;
      try { absolute = new URL(raw.startsWith("//") ? `https:${raw}` : raw); } catch { return "external"; }
      if (!/^https?:$/.test(absolute.protocol)) return "external";
      if (!this.hosts.includes(absolute.hostname.replace(/^www\./, ""))) return "external";
      return this.classifyPath(absolute.pathname);
    }

    /* Relative hrefs are rare here but legal, and they mean nothing without the page
       they were written on, so resolution goes through that page's own URL. */
    let resolved;
    try { resolved = new URL(raw, `https://site.invalid${fromUrl.startsWith("/") ? fromUrl : `/${fromUrl}`}`); }
    catch { return "external"; }
    return this.classifyPath(resolved.pathname);
  }

  classifyPath(urlPath) {
    const target = canonical(decode(urlPath));
    if (this.pages.has(target)) return "page";
    if (this.isStatic(target)) return "static";
    if (this.isRedirected(target)) return "redirect";
    return "dead";
  }

  isStatic(target) {
    for (const [prefix, source] of this.passthrough) {
      if (canonical(prefix) === target && fs.existsSync(source)) return true;
      const base = prefix.endsWith("/") ? prefix : `${prefix}/`;
      if (!target.startsWith(base) && `${target}/` !== base) continue;
      const rest = target.slice(base.length);
      if (rest && fs.existsSync(path.join(source, rest))) return true;
    }
    return false;
  }

  isRedirected(target) {
    if (this.redirects.exact.has(target)) return true;
    return this.redirects.prefixes.some((prefix) => `${target}/`.startsWith(prefix));
  }

  /* Grouped by the page the link was written on, because that is the file somebody
     has to open to fix it. The vault path is what gets printed for the same reason:
     `src/Notes/Entries/notes/…` is a symlink artifact, and nobody edits a note there. */
  record(result, href) {
    const source = sourceLabel(result.inputPath);
    if (!this.findings.has(source)) this.findings.set(source, { urls: new Set(), hrefs: new Map() });
    const finding = this.findings.get(source);
    finding.urls.add(result.url);
    /* One input path can write many pages — Album Group.njk paginates, and it
       syndicates each album's own excerpt, so the same dead href turns up on several
       group pages. The count and the page it was seen on say which is happening. */
    const seen = finding.hrefs.get(href) ?? { count: 0, url: result.url };
    finding.hrefs.set(href, { count: seen.count + 1, url: seen.url });
  }

  /* `results` from `eleventy.after`: every page the build wrote, with its HTML. */
  scan(results = []) {
    for (const result of results) {
      if (!(result.outputPath || "").endsWith(".html")) continue;
      /* The fixtures under src/test carry deliberately unresolvable links, so a
         finding there means the fixture is doing its job. */
      if (isFixture(result.inputPath)) continue;
      for (const match of String(result.content ?? "").matchAll(ANCHOR_HREF)) {
        const href = match[1] ?? match[2] ?? match[3] ?? "";
        if (this.classify(href, result.url ?? "/") === "dead") this.record(result, href);
      }
    }
    return this;
  }

  report(log = console) {
    if (this.findings.size === 0) {
      log.log("[dead-links] clean");
      return 0;
    }
    const total = [...this.findings.values()]
      .reduce((sum, finding) => sum + [...finding.hrefs.values()].reduce((a, b) => a + b.count, 0), 0);
    log.warn(`[dead-links] ${total} internal link(s) with no page behind them, in ${this.findings.size} source file(s):`);
    for (const [source, finding] of [...this.findings.entries()].sort()) {
      const many = finding.urls.size > 1;
      log.warn(`  ${source}${many ? ` (${finding.urls.size} pages)` : ` → ${[...finding.urls][0]}`}`);
      for (const [href, seen] of finding.hrefs) {
        log.warn(`      ${href}${seen.count > 1 ? ` (\u00d7${seen.count})` : ""}${many ? ` on ${seen.url}` : ""}`);
      }
    }
    return total;
  }

  reset() {
    this.findings.clear();
  }
}

function isFixture(inputPath) {
  const normalized = String(inputPath ?? "").replace(/^\.\//, "");
  return normalized.startsWith("src/test/");
}

/* Published notes reach 11ty through symlinks into the vault, so the input path is
   an implementation detail of the routing. Resolving it names the file to edit. */
function sourceLabel(inputPath) {
  const absolute = path.resolve(String(inputPath ?? ""));
  let real = absolute;
  try { real = fs.realpathSync(absolute); } catch { /* deleted mid-watch */ }
  const relative = path.relative(process.cwd(), real);
  return relative.startsWith("..") ? real : relative;
}
