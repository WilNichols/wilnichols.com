require('dotenv').config();

const { DateTime } = require("luxon");
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const markdownIt = require('markdown-it');
const fs = require('fs');
const { getAverageColor } = require('fast-average-color-node');
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const sizeOf = require('image-size');

module.exports = function(eleventyConfig) {
  const markdownItOptions = {
      html: true,
      breaks: false,
      linkify: true,
      typographer: true,
  };
  // From Benyamin: https://github.com/binyamin/eleventy-garden/discussions/45
  const md = markdownIt(markdownItOptions)
  .use(require('markdown-it-footnote'))
  .use(require('markdown-it-attrs'))
  .use(function(md) {
      // Recognize Mediawiki links ([[text]])
      md.linkify.add("[[", {
          validate: /^\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/,
          normalize: match => {
              const parts = match.raw.slice(2,-2).split("|");
              parts[0] = parts[0].replace(/.(md|markdown)\s?$/i, "");
              match.text = (parts[1] || parts[0]).trim();
              match.url = `/${parts[0].trim().replace(/\s/g, "-")}/`;
          }
      })
  })
  
  eleventyConfig.setLibrary('md', md);

  // Collections
  eleventyConfig.addCollection("notes", function (collection) {
      return collection.getFilteredByGlob(["notes/**/*.md", "index.md"]);
  });
  
  // Filters
  eleventyConfig.addFilter("markdownify", string => {
      return md.render(string)
  })
  
  // simple cache busting method from https://rob.cogit8.org/posts/2020-10-28-simple-11ty-cache-busting/
  eleventyConfig.addFilter("bust", (url) => {
    const [urlPart, paramPart] = url.split("?");
    const params = new URLSearchParams(paramPart || "");
    params.set("v", DateTime.local().toFormat("X"));
    return `${urlPart}?${params}`;
  });
  
  eleventyConfig.addFilter("postDate", (dateObj) => {
    dateObj = dateObj.toString();
    return DateTime.fromISO(dateObj).toLocaleString(DateTime.DATE_MED);
  });
  
  eleventyConfig.addAsyncFilter("getPhotos",  async function(dir) {
    // do some Async work
    const client = new S3Client({ 
      region: "us-east-1" ,
      credentials: {
        accessKeyId: process.env.WN_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.WN_AWS_SECRET_ACCESS_KEY
      }
    });
    const albumsParams = {
      Bucket: 'wnphoto01',
      Delimiter: '/',
      Prefix: 'gallery-2023/' + dir + '/'
    };
    
    const command = new ListObjectsV2Command(albumsParams);
    let data;
    let albums;
    try {
      if (process.env.OFFLINE) {
        albums = JSON.parse(fs.readFileSync('./_offline/aws/' + dir + '.json'));
      } else {
        data = await client.send(command);
        albums = data.Contents.map(a => a.Key.replace(albumsParams.Prefix, '').replace(albumsParams.Delimiter, ''));
      };
      // fs.writeFileSync('./aws-' + dir + '.json', JSON.stringify(albums, null, 1) , 'utf-8');
    } catch (error) {
      return 'AWS failure'
    } finally {
      return albums;
    }
  });
  
  eleventyConfig.addAsyncFilter('imageInfo', async function(src) {
    const path = src.replace('https://wnphoto-1e743.kxcdn.com', '_offline/thumbs').replace('.jpg', '.webp').replace('.png', '.webp');
    const width = sizeOf(path).width;
    const height = sizeOf(path).height;
    async function getColor() {
      return getAverageColor(path).then(color => {
          return color.hex;
      });
    };
    const color = await getColor();
    return {path: path, height: height, width: width, ratio: width/height, color: color};
  });
  
  // Server
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
