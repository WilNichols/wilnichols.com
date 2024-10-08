require('dotenv').config();

const { DateTime } = require("luxon");
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor')
const markdownItAttrs = require('markdown-it-attrs')
const markdownItFootnote = require('markdown-it-footnote');
const markdownItTitle = require('markdown-it-title');
const fs = require('fs');
const { getAverageColor } = require('fast-average-color-node');
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const sizeOf = require('image-size');
const pluginRss = require("@11ty/eleventy-plugin-rss");
const beautify = require('js-beautify/js');
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function(eleventyConfig) {
  eleventyConfig.setQuietMode(true);
  const markdownItOptions = {
      html: true,
      breaks: false,
      linkify: true,
      typographer: true,
  };
  // From Benyamin: https://github.com/binyamin/eleventy-garden/discussions/45
  const md = markdownIt(markdownItOptions)
  .use(markdownItAnchor)
  .use(markdownItAttrs)
  .use(markdownItFootnote)
  .use(markdownItTitle)
  .use(function(md) {
      // Recognize Mediawiki links ([[text]])
      md.linkify.add("[[", {
          validate: /^\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/,
          normalize: match => {
              const parts = match.raw.slice(2,-2).split("|");
              parts[0] = parts[0].replace(/.(md|markdown)\s?$/i, "");
              match.text = (parts[1] || parts[0]).trim();
              match.url = `/${parts[0].trim().replace(/\s/g, "-").toLowerCase()}/`;
          }
      });
      // remove the hr
      md.renderer.rules.footnote_block_open = () => (
        '<section class="footnotes">\n' +
        '<ol class="footnotes-list">\n'
      );
  })
  
  eleventyConfig.setLibrary('md', md);
  
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
  
  // Filters
  
  eleventyConfig.addFilter("getRevision", string => {
    return string.split("Evergreen/v")[1];
  });
  
  eleventyConfig.addFilter("penAssets", (object) => {
    return Object.entries(object).filter(([key, _]) => key !== "demo");
  });
  
  eleventyConfig.addFilter("penHTML", string => {
    const content = string.substring(string.indexOf("<!---->") + 7, string.lastIndexOf("<!---->"));
    return beautify.html(content, { indent_size: 2 });
  });
  
  eleventyConfig.addFilter("penSCSS", string => {
    return beautify.css(string, { indent_size: 2 });
  });
  
  // https://stackoverflow.com/questions/66083103/how-to-generate-a-list-of-all-collections-in-11ty
  eleventyConfig.addCollection("tagsList", function(collectionApi) {
      const tagsList = new Set();
      collectionApi.getAll().map( item => {
          if (item.data.tags) { // handle pages that don't have tags
              item.data.tags.map( tag => tagsList.add(tag))
          }
      });
      return tagsList;
  });
  
  eleventyConfig.addFilter("markdownify", string => {
      return md.render(string)
  });
  
  // simple cache busting method from https://rob.cogit8.org/posts/2020-10-28-simple-11ty-cache-busting/
  eleventyConfig.addFilter("bust", (url) => {
    const [urlPart, paramPart] = url.split("?");
    const params = new URLSearchParams(paramPart || "");
    params.set("v", DateTime.local().toFormat("X"));
    return `${urlPart}?${params}`;
  });
  
  eleventyConfig.addFilter("readableDateJS", (dateObj) => {
    return dateObj;
    // return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("LLL d, yyyy");
  });
  
  eleventyConfig.addFilter("readableDateISO", (dateObj) => {
    return DateTime.fromISO(dateObj, { zone: "utc" }).toFormat("LLL d, yyyy");
  });
  
  eleventyConfig.addFilter("postDay", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("dd");
  });
  
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('MMMM d, yyyy')
  });
  
  eleventyConfig.addFilter('typeOf', (obj) => {
    console.log(obj + typeof obj);
  })
  
  eleventyConfig.addFilter("getFullMonth", (Index) => {
    const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return month[Index];
  })
  
  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });
  
  eleventyConfig.addFilter("sitemapDateTimeString", (dateObj) => {
    const dt = DateTime.fromJSDate(dateObj, { zone: "utc" });
    if (!dt.isValid) {
      return "";
    }
    return dt.toISO();
  });
  // https://stevenwoodson.com/blog/a-step-by-step-guide-to-sorting-eleventy-global-data-files-by-date/
  eleventyConfig.addFilter("sortDataByCreationDate", (obj) => {
    const sorted = {};
    Object.keys(obj)
      .sort((a, b) => {
        return obj[a].data.created > obj[b].data.created ? 1 : -1;
      })
      .forEach((name) => (sorted[name] = obj[name]));
    return sorted;
  });
  
  eleventyConfig.addAsyncFilter("getPhotos",  async function(dir) {
    // do some Async work
    // console.log('getting photos for ' + dir);
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
    const path = src.replace(process.env.KXCDN, '_offline/thumbs').replace('.jpg', '.webp').replace('.png', '.webp');
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
  
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  eleventyConfig.addFilter('log', (value) => {
    console.log('\x1b[37m', value);
    console.log('\x1b[0m', '');
  });
  
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  eleventyConfig.addFilter('warn', (value) => {
    console.warn('\x1b[33m', value);
    console.log('\x1b[0m', '');
  });
  
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  eleventyConfig.addFilter('error', (value) => {
    console.error('\x1b[31m', value);
    console.log('\x1b[0m', '');
  });
  
  // Server
  eleventyConfig.setServerOptions({
    liveReload: true
  });
  
  // Passthroughs. Specify individual instead of all, since sass is handled separately
  eleventyConfig.addPassthroughCopy({"src/vid.html": "/vid.html"});
  eleventyConfig.addPassthroughCopy({"src/robots.txt": "/robots.txt"});
  eleventyConfig.addPassthroughCopy({"src/static/img": "/assets/img"});
  eleventyConfig.addPassthroughCopy({"src/static/js": "/assets/js"});
  eleventyConfig.addPassthroughCopy({"src/static/vid": "/assets/vid"});
  eleventyConfig.addPassthroughCopy({"src/static/embeds": "/assets/embeds"});
  eleventyConfig.addPassthroughCopy({"src/static/favicon": "/"});
  
  // CSS Mapping
  if (process.env.ELEVENTY_ENV == 'dev') {
    eleventyConfig.addPassthroughCopy({"src/static/css": "/src/static/css"});
  }
  
  // Plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(syntaxHighlight);
  
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
