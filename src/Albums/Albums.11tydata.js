import slugify from "@sindresorhus/slugify";

export default function () {
  return {
    layout: "album.njk",
    tags: ["Albums", "Topic/Photography"],
    eleventyComputed: {
      permalink: data => '/albums/' + slugify(data.page.fileSlug).replace('-s', 's') + '/'
    }
  }
}
