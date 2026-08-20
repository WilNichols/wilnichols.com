export default {
  permalink: false,
  eleventyComputed: {
    description: function (data) { return this.excerpt(data.page?.rawInput); },
  }
}
