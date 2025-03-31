import slugify from "@sindresorhus/slugify";

export default function () {
  return {
    tags: ["Links", "Type/Link"],
    layout: 'note.njk',
    eleventyComputed: {
      permalink: data => (data.page.rawInput) ? '/links/' + slugify(data.page.fileSlug).replace('-s', 's') + '/' : false
    }
  }
}
