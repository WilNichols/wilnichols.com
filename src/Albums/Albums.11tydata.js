import slugify from "@sindresorhus/slugify";

export default function () {
  return {
    layout: "album.njk",
    tags: ["Albums"],
    eleventyComputed: {
      permalink: data => '/albums/' + slugify(data.page.fileSlug).replace('-s', 's') + '/'
    }
  }
}
