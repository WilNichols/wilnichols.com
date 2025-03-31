export default function () {
  return {
    permalink: "/{{ page.fileSlug | slugify }}/index.html",
    tags: "Prototypes",
    permalink: false
  }
}
