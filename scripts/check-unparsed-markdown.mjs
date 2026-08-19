/* Guards against markdown reaching a page unparsed.

   A preprocessor that replaces a block with a macro call has to leave the blank
   line that followed it. Without one, the macro renders to a block element and
   markdown-it keeps swallowing the rest of the document as part of that HTML
   block, so everything after it ships as literal markdown. That happened twice:
   once to the pen code fences, once to the recipe ingredients table, where the
   whole Directions section came out raw.

   Run against _site after a build. Exits non-zero on a finding. */
import fs from "node:fs";
import path from "node:path";

const TELLS = {
  "raw ATX heading": /(?<![>\w])#{2,4} [A-Z]/,
  "raw attribute braces": /\{\.[a-z][a-z0-9-]*\}/,
  "raw footnote reference": /\[\^\d+\]/,
  "raw markdown link": /\[[^\]<>]{2,40}\]\(https?:\/\//,
  "raw pipe table": /\n\s*\|[^\n|]+\|[^\n]*\n\s*\|\s*[-: ]+\|/,
  "raw ordered list item": /(?<![>\w])\n\d+\. [A-Z]/,
};

const root = process.argv[2] ?? "_site";
const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!entry.name.endsWith(".html")) continue;
    const html = fs.readFileSync(full, "utf8");
    /* Only the body: a <script> or a JSON-LD blob can contain anything. */
    const start = html.indexOf("<main");
    const body = start === -1 ? html : html.slice(start, html.indexOf("</main>"));
    for (const [label, pattern] of Object.entries(TELLS)) {
      if (pattern.test(body)) findings.push(`${path.relative(root, full)}: ${label}`);
    }
  }
}

if (!fs.existsSync(root)) {
  console.log(`[unparsed-markdown] ${root} not built, skipping`);
  process.exit(0);
}
walk(root);
if (findings.length) {
  console.error(`[unparsed-markdown] ${findings.length} finding(s):`);
  for (const f of findings) console.error("  " + f);
  process.exit(1);
}
console.log("[unparsed-markdown] clean");
