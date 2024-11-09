export default function () {
  return {
    layout: "album.njk",
    permalink: "/albums/{{ page.fileSlug | slugify }}/",
    tags: "Albums",
  }
}
