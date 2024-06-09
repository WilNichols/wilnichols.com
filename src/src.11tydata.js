// Lots from Benyamin. https://github.com/b3u/jubilant-pancake/blob/master/notes/notes.11tydata.js#L33

// This regex finds all wikilinks in a string
const wikilinkRegExp = /\[\[\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/g

function caselessCompare(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

module.exports = {
  eleventyComputed: {
    title: "{{ page.fileSlug }}",
    month: function (data) {
      const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      return month[(new Date(data.date || data.page.date).getMonth())];
    },
    year: function (data) {
      return new Date(data.date || data.page.date).getFullYear();
    },
    backlinks: (data) => {
      const all = data.collections.all;
      const currentFileSlug = data.page.fileSlug;
      let backlinks = [];
      // Search the other notes for backlinks
      for (const otherPage of all) {
        const pageContent = otherPage.template.frontMatter.content;
  
        // Get all links from otherNote
        const outboundLinks = (pageContent.match(wikilinkRegExp) || [])
          .map(link => (
            // Extract link location
            link.slice(2, -2)
            .split("|")[0]
            .replace(/.(md|markdown)\s?$/i, "")
            .trim()
          ));
        // If the other note links here, return related info
        if (outboundLinks.some(link => caselessCompare(link, currentFileSlug))) {
  
          // Construct preview for hovercards
          let preview = pageContent.slice(0, 240);
          let spaceIndex = preview.lastIndexOf(" ");
          preview = pageContent.slice(0, spaceIndex) + "…";
  
          backlinks.push({
            url: otherPage.url,
            title: otherPage.data.title,
            preview
          })
        }
      }
  
      return backlinks;
    }
  }
}