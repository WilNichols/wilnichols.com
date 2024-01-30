const { EleventyRenderPlugin } = require("@11ty/eleventy");
const markdown = require("markdown-it")({
  html: true,
  breaks: false,
  linkify: true,
  typographer: true,
}).use(require('markdown-it-attrs'));

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.setLibrary('md', markdown);
  eleventyConfig.setServerOptions({
    liveReload: true
  });
  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts"
    }
  }
};
