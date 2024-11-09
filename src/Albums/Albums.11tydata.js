export default function () {
  return {
    layout: "album.njk",
    tags: "Albums",
    eleventyComputed: {
      permalink: "/albums/{{ page.fileSlug | slugify }}/"
    }
  }
}
