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
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#*`_~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length <= 140) return text;
      return text.slice(0, 139).replace(/\s+\S*$/, '') + '…';
    }
  }
}
