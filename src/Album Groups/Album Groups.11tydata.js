/* An intro note is one by virtue of living here. The vault used to say so with an
   authored tag; it no longer does, so the tag is injected. It has to stay a tag:
   an intro and its albums share the AlbumGroup/<Name> collection, and this is
   what tells them apart inside it. */
export default {
  permalink: false,
  tags: ["AlbumGroupIntro"],
  eleventyComputed: {
    description: function (data) { return this.excerpt(data.page?.rawInput); },
  }
}
