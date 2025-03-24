export default function () {
  return {
    permalink: "/{{ page.fileSlug | slugify }}/index.html",
    tags: ["Recipe", "Type/Recipe"],
    layout: 'recipe.njk'
  }
}
