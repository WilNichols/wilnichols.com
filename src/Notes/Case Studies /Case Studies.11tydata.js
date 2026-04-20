export default function () {
  return {
    permalink: "/{{ page.fileSlug | slugify }}/index.html",
    tags: ["Case Study", "Type/Case Study"],
    layout: 'case-study.njk'
  }
}
