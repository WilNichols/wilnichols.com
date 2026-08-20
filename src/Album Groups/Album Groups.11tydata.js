export default {
  permalink: false,
  eleventyComputed: {
    description: data => {
      const raw = data.page?.rawInput ?? '';
      const body = raw.replace(/^---[\s\S]*?---\n?/, '').trim();
      if (!body) return null;
      const text = body
        .replace(/<[^>]*>/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        /* Wikilinks reach here verbatim, so a description leaked "[[Auvergne 6 |
           visit to Auzon]]" into every meta and og tag. Keep the display text,
           or the last path segment when the link is path-qualified. */
        .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, target, display) =>
          (display !== undefined ? display : target.split('/').pop()).trim())
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#*`_~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length <= 140) return text;
      return text.slice(0, 139).replace(/\s+\S*$/, '') + '…';
    }
  }
}
