module.exports = {
  layout: 'album.njk',
  permalink: "/albums/{{ page.fileSlug | slugify }}/index.html",
  tags: 'albums'
}
