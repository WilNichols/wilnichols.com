export default function () {
  return {
    permalink: "/{{ page.fileSlug | slugify }}/index.html",
    tags: "Pens",
    layout: 'post.njk',
    postType: 'pen',
    postCollection: 'Pens'
  }
}
