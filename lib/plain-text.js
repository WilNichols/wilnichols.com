/* Note markdown to plain prose, for anywhere text is emitted rather than
   rendered: meta and og descriptions, RSS, index cards. */

export function plainText(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    /* Before markdown links. Keep the display half, else the last path segment. */
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
