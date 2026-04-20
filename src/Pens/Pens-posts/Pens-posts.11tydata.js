export default function () {
  return {
    permalink: "/{{ page.fileSlug | slugify }}/index.html",
    tags: "Pens",
    layout: "pen.njk"
  }
}
