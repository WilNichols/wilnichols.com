export default function () {
  return {
    permalink: "/{{ page.fileSlug | slugify }}/index.html",
    tags: ["Recipe", "Type/Recipe"],
    layout: 'post.njk',
    postType: 'recipe',
    eleventyComputed: {
      // Recipes author a plain `ingredients:` list in frontmatter, which is what
      // Obsidian shows as a property. renderTemplate needs a named scope object
      // rather than a bare array, so that wrapper is built here instead of being
      // spelled out in every note.
      ingredientsContainer: data =>
        data.ingredients ? { ingredients: data.ingredients } : null
    }
  }
}
