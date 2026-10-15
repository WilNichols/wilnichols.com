/* Entity notes, read straight off the vault and keyed by their vault path.

   Entities are not symlinked into src — they publish nothing — so 11ty never
   sees them as templates and no index of built pages can contain them. Their
   frontmatter still matters: a person's `website:` is the destination a link to
   them should reach, and it is written down once, on their note. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "vault", "Entities");

function frontmatter(file) {
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---\n", 3);
  if (end === -1) return {};
  const out = {};
  for (const line of raw.slice(4, end).split("\n")) {
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (m && m[2] !== "") out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

let cache = null;
export function entityNotes() {
  if (cache) return cache;
  cache = {};
  if (!fs.existsSync(ROOT)) return cache;
  for (const kind of fs.readdirSync(ROOT)) {
    const dir = path.join(ROOT, kind);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const name = file.slice(0, -3);
      if (name === kind) continue;                  /* the folder note */
      cache[`Entities/${kind}/${name}`] = { kind, name, ...frontmatter(path.join(dir, file)) };
    }
  }
  return cache;
}

/* The destination a wikilink to an entity should reach when the entity has no
   page: its own site. Falls through to null, which renders as plain text. */
export function entityWebsite(target) {
  const key = String(target).trim().replace(/^\.?\//, "").replace(/\.md$/i, "");
  const store = entityNotes();
  if (store[key]?.website) return store[key].website;
  /* `[[Sam Valdez]]` as well as `[[Entities/People/Sam Valdez]]`. */
  const suffix = key.split("/").pop().toLowerCase();
  for (const [k, v] of Object.entries(store)) {
    if (v.website && k.split("/").pop().toLowerCase() === suffix) return v.website;
  }
  return null;
}
