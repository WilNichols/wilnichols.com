export default function () {
  return {
    permalink: "/{{ page.fileSlug | slugify }}/index.html",
    tags: "Notes",
    layout: 'note.njk'
  }
}
