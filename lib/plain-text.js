/* Turning a note's markdown into plain prose, for the places that emit text
   rather than HTML: meta and og descriptions, RSS <description>, index cards.

   This lived twice, copy-pasted into the Albums and Album Groups directory data,
   and neither copy stripped wikilinks — so every album whose body opened with a
   `[[link]]` shipped `<meta name="description" content="… a [[Auvergne 6 | visit
   to Auzon]] …">`. One implementation, imported wherever raw note text becomes
   output. */

export function plainText(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    /* Wikilinks before markdown links: keep the display half of
       [[Path/To/Note|display]], else the last path segment of a bare link. */
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, target, display) =>
      (display !== undefined ? display : target.split("/").pop()).trim())
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*`_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* The first ~140 characters of a note's body, frontmatter removed. */
export function excerpt(rawInput, limit = 140) {
  const body = String(rawInput ?? "").replace(/^---[\s\S]*?---\n?/, "").trim();
  if (!body) return null;
  const text = plainText(body);
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).replace(/\s+\S*$/, "") + "…";
}
