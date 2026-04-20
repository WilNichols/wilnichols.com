export default function () {
  return {
    permalink: "/{{ page.fileSlug | slugify }}/index.html",
    tags: ["Notes", "Type/Note"],
    layout: 'note.njk'
  }
}
