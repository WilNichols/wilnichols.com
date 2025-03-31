import slugify from "@sindresorhus/slugify";

export default function () {
  return {
    tags: ["Links", "Type/Link"],
    layout: 'note.njk',
    eleventyComputed: {
      permalink: data => data.dest ? false : '/links/' + slugify(data.page.fileSlug).replace('-s', 's') + '/'
    }
  }
}
