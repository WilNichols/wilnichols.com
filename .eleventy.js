const { EleventyRenderPlugin } = require("@11ty/eleventy");
const markdown = require("markdown-it")({
  html: true,
  breaks: false,
  linkify: true,
  typographer: true,
}).use(require('markdown-it-attrs'));

module.exports = function(eleventyConfig) {
  
  // Misc
  eleventyConfig.setLibrary('md', markdown);
  eleventyConfig.setServerOptions({
    liveReload: true
  });
  
  // Passthroughs. Specify individual instead of all, since sass is handled separately
  eleventyConfig.addPassthroughCopy({"src/robots.txt": "/robots.txt"});
  eleventyConfig.addPassthroughCopy({"src/static/img": "/assets/img"});
  eleventyConfig.addPassthroughCopy({"src/static/js": "/assets/js"});
  eleventyConfig.addPassthroughCopy({"src/static/favicon": "/"});
  
  // CSS Mapping
  if (process.env.ELEVENTY_ENV == 'dev') {
    eleventyConfig.addPassthroughCopy({"src/static/css": "/src/static/css"});
  }
  
  // WatchTargets
  eleventyConfig.addWatchTarget("src/static/css/");
  eleventyConfig.addWatchTarget("src/static/js/");
  eleventyConfig.setWatchThrottleWaitTime(1000); // in milliseconds
  
  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts"
    }
  }
};
