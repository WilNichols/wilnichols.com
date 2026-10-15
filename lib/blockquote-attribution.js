/* Attribution for a quotation, which markdown has no syntax for.

   The vault writes an attribution as a single-item list directly after the
   quote, which is a shape Obsidian renders and edits natively:

       > Blessed are those who weep.
       - Luke 6:21

   It used to be hand-written HTML, `<cite>Luke 6:21</cite>` on its own line, and
   this branch's pages and styles are built around what that produced. So the
   list becomes exactly that again:

       <blockquote><p>Blessed are those who weep.</p></blockquote>
       <p><cite>Luke 6:21</cite></p>

   The detection is shared with new/main's rule; only the output differs, and
   new/main's <figure>/<figcaption> replaces this when it merges.

   SINGLE ITEM ONLY. Two bullets are a list that happens to follow a quote, and
   are left alone. This is the whole guard against eating real content. */

/* A list qualifies when it holds exactly one item. Returns the item's inline
   token and the index just past the list, or null when it does not qualify. */
function soleItem(tokens, listOpenIdx) {
  let depth = 0;
  let items = 0;
  let inline = null;
  for (let i = listOpenIdx; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "bullet_list_open") depth++;
    if (t.type === "list_item_open" && depth === 1) items++;
    if (t.type === "inline" && depth === 1 && items === 1 && !inline) inline = t;
    if (t.type === "bullet_list_close" && --depth === 0) {
      return items === 1 && inline ? { inline, end: i } : null;
    }
  }
  return null;
}

function blockToken(Token, type, tag, nesting) {
  const t = new Token(type, tag, nesting);
  t.block = true;
  return t;
}

function htmlInline(Token, content) {
  const t = new Token("html_inline", "", 0);
  t.content = content;
  return t;
}

export default function blockquoteAttribution(md) {
  md.core.ruler.push("blockquote_attribution", (state) => {
    const { Token } = state;
    const tokens = state.tokens;

    // Backwards, so rewriting one list cannot shift the indices still to come.
    for (let i = tokens.length - 2; i >= 0; i--) {
      if (tokens[i].type !== "blockquote_close") continue;
      if (tokens[i + 1].type !== "bullet_list_open") continue;
      // A deeper list belongs to the quote's own content, not to the quote.
      if (tokens[i + 1].level !== tokens[i].level) continue;

      const item = soleItem(tokens, i + 1);
      if (!item) continue;

      const inline = item.inline;
      inline.children = [htmlInline(Token, "<cite>"), ...(inline.children || []), htmlInline(Token, "</cite>")];
      const open = blockToken(Token, "paragraph_open", "p", 1);
      const close = blockToken(Token, "paragraph_close", "p", -1);
      open.level = close.level = tokens[i].level;
      inline.level = tokens[i].level + 1;
      tokens.splice(i + 1, item.end - i, open, inline, close);
    }
  });
}
