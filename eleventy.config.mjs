import crypto from "crypto";
import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { EleventyRenderPlugin, EleventyHtmlBasePlugin } from '@11ty/eleventy';
import { AssetCache, Fetch } from '@11ty/eleventy-fetch';
import htmlmin from "html-minifier-terser";
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItTitle from 'markdown-it-title';
import { getAverageColor } from 'fast-average-color-node';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import sizeOf from 'image-size';
import slugify from "@sindresorhus/slugify";
import pluginRss from '@11ty/eleventy-plugin-rss';
import beautify from 'js-beautify';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import { JSDOM } from 'jsdom';

dotenv.config();

async function imageInfo(url) {
  try {
    const image = await Fetch(url, {
      duration: '*',
      type: 'buffer',
      directory: cachePath,
      fetchOptions: {
        signal: AbortSignal.timeout(300000),
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
        },
      },
    });
    const width = sizeOf(image).width;
    const height = sizeOf(image).height;
    let orientation = (width == height) ? 'square' : (( width > height ) ? 'landscape' : 'portrait');
    async function getColor() {
      return getAverageColor(image).then(color => {
          return color.hex;
      });
    };
    const color = await getColor();
    const obj = {path: url, height: height, width: width, ratio: width/height, orientation: orientation, color: color};
    console.warn('fetching: ' + url);
    return obj; 
  } catch {
    return {
      error: 'true',
      path: '#',
      height: 4,
      width: 6,
      ratio: 1.5,
      orientation: 'landscape',
      color: '#a5a5a5'
    }
  }
}

export default async function(eleventyConfig) {
  eleventyConfig.setQuietMode(true);
  let cachePath = process.env.ELEVENTY_ENV === 'dev' ? '.cache' : '/opt/build/cache/';
  
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
            match.url = `/` + slugify(`${parts[0].trim().replace(/\s/g, "-")}/`).replace('-s', 's') + `/`;
        }
    });
    // remove the hr
    md.renderer.rules.footnote_block_open = () => (
      '<section class="footnotes">\n' +
      '<ol class="footnotes-list">\n'
    );
    md.linkify.set({ fuzzyLink: false });
  })
  
  eleventyConfig.setLibrary('md', md);
  
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
  
  // Filters
  
  eleventyConfig.addFilter("links_to", async function(collection, target) {
    const hostname = "wilnichols.com";
    const cache = {};
    function getLinks(html) {
        if (cache[html]) {
            return cache[html];
        }
    
        const dom = new JSDOM(html);
        const document = dom.window.document;
    
        const result = new Set([...document.querySelectorAll("a[href]")]
            .map(x => {
                let href = x.getAttribute("href");
    
                // Normalise internal links
                const url = new URL(href, `https://${hostname}`);
                if (url.hostname == hostname) {
                    return url.pathname;
                }
    
                url.hash = "";
                return url.toString();
            }));
        cache[html] = result;
        return result;
    }
      return collection.filter(item => getLinks(item.content).has(target));
  });
  
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

  eleventyConfig.addFilter("mdRenderNJK", (obj) => {
    return obj.replace(/[\n\r\t]/gm, '');
  });
  
  // https://stackoverflow.com/questions/66083103/how-to-generate-a-list-of-all-collections-in-11ty
  eleventyConfig.addCollection("tagsList", function(collectionsApi) {
      const tagsList = new Set();
      collectionsApi.getAll().map( item => {
          if (item.data.tags) { // handle pages that don't have tags
              item.data.tags.map( tag => tagsList.add(tag))
          }
      });
      return tagsList;
  });
  
  eleventyConfig.addCollection("glassPhotos", async (collectionsApi) => {
    // we sent these to a collection b/c njk templates can't read straight from eleventyComputed
    const allItems = collectionsApi.getFilteredByTag("cameraRollSource");
    const glassPhotos = (
      await Promise.all(
        allItems.map(async (item) => {
          let photos = item.data?.eleventyComputed?.photos;
          if (!photos) return [];
          if (typeof photos === "function") photos = photos(item.data);
          return await Promise.resolve(photos);
        })
      )
    ).flat().filter(Boolean);
    return glassPhotos;
  });
  
  eleventyConfig.addCollection("photos", async (collectionsApi) => {
    const allItems = collectionsApi.getAll();
  
    const allPhotos = (
      await Promise.all(
        allItems.map(async (item) => {
          let photos = item.data?.eleventyComputed?.photos;
          if (!photos) return [];
          if (typeof photos === "function") photos = photos(item.data);
          return await Promise.resolve(photos);
        })
      )
    ).flat().filter(Boolean);
   async function testMe(string) {
    return string + ' test test test'
   }
    const photoMap = Object.fromEntries(
      await Promise.all(
        allPhotos
          .filter(photo => photo && photo.key)
          .map(async ({key, lastModified, meta}) => {
            let host;
            try {
              const u = new URL(key);
              host = `${u.protocol}//${u.host}`;
            } catch {
              host = process.env.CDN;
            }
            const url = `${host}/${key}`;
  
            const cacheFile = crypto
              .createHash("sha1")
              .update(url)
              .digest("base64")
              .replace(/[^a-zA-Z0-9]/g, "")
              .substring(0, 7)
              .toLowerCase();
  
            const args = (host === process.env.CDN) ? '?width=6px&format=webp' : '';
            const test = testMe('wtf');
            const obj = {key, lastModified, host, url, cacheFile, args, meta, test};
            
            const asset = new AssetCache(url);
            if (!asset.isCacheValid("30d")) {
              await asset.save(obj, "json");
            }

            let cached = await asset.getCachedValue();

            // When the cache is first written, it returns objects as strings.
            if (typeof cached === "string") {
              cached = JSON.parse(cached); 
            }

            return [key, cached];
          })
      )
    );
    console.log(photoMap)
    return photoMap;
  });
  
  eleventyConfig.addCollection("Feed", function (collectionsApi) {
    const feed = [
      ...collectionsApi.getFilteredByTag("Type/Case Study"),
      ...collectionsApi.getFilteredByTag("Type/Note"),
      ...collectionsApi.getFilteredByTag("Type/Link"),
      ...collectionsApi.getFilteredByTag("Type/Recipe"),
      ...collectionsApi.getFilteredByTag("Type/NewAlbum")
    ];
    const sortedFeed = feed.sort(function(a, b) {
      return (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0);
    });
    return sortedFeed;
  });
  
  // https://stackoverflow.com/questions/66083103/how-to-generate-a-list-of-all-collections-in-11ty
  eleventyConfig.addCollection("Drafts", function (collectionsApi) {
    return collectionsApi.getAll().filter(function (item) {
      return "draft" in item.data;
    });
  });
  
  eleventyConfig.addFilter("draftsOf", (collection1, collection2) => {
    return collection1.filter(value => collection2.includes(value));
  });
  
  eleventyConfig.addFilter("markdownify", string => {
    return md.renderInline(string)
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
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("LLL d, yyyy");
  });
  
  eleventyConfig.addFilter("readableDateISO", (dateObj) => {
    return DateTime.fromISO(dateObj, { zone: "utc" }).toFormat("LLL d, yyyy");
  });
  
  eleventyConfig.addFilter("postDay", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("dd");
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
  
  
  eleventyConfig.addFilter("createAlbumTags", function (arr) {
    if (!Array.isArray(arr)) return [];
    const grouped = Object.values(
      arr.reduce((acc, { key, value }) => {
        if (!acc[key]) {
          acc[key] = { key, value };
        } else {
          acc[key].value += `, ${value}`;
        }
        return acc;
      }, {})
    );
    return grouped;
  });
  
  eleventyConfig.addAsyncFilter('imageInfo', async function(url) {
    if (process.env.FAST) {
      try {
        if (process.env.FAST) {
          return {
            path: '#',
            height: 4,
            width: 6,
            ratio: 1.5,
            orientation: 'landscape',
            color: '#a5a5a5'
          }
        } else {
          const image = await Fetch(url, {
            duration: '*',
            type: 'buffer',
            directory: cachePath,
            fetchOptions: {
              signal: AbortSignal.timeout(300000),
              headers: {
                "user-agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
              },
            },
          });
          const width = sizeOf(image).width;
          const height = sizeOf(image).height;
          let orientation = (width == height) ? 'square' : (( width > height ) ? 'landscape' : 'portrait');
          async function getColor() {
            return getAverageColor(image).then(color => {
                return color.hex;
            });
          };
          const color = await getColor();
          const obj = {path: url, height: height, width: width, ratio: width/height, orientation: orientation, color: color};
          console.warn('fetching: ' + url);
          return obj; 
        }
      } catch (err) {
        // console.warn(url);
        // console.warn("Error on: ", err);
        return null;
      }
    } else {
      return null;
    }
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
  eleventyConfig.addPassthroughCopy({"src/_redirects": "/_redirects"});
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
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  
  // Bundles
  eleventyConfig.addBundle("js");

  // WatchTargets
  eleventyConfig.addWatchTarget("src/static/css/");
  eleventyConfig.addWatchTarget("src/static/js/");
  eleventyConfig.setWatchThrottleWaitTime(1000); // in milliseconds
  
  eleventyConfig.addTransform("trimMarkdown", async function (content) {
    if ((this.page.outputPath || "").endsWith(".html")) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
    }
    return content;
  });
  
  eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
    if(data.draft && process.env.ELEVENTY_ENV === "prod") {
      return false;
    }
  });
  
  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts"
    },
    markdownTemplateEngine: "njk"
  }
};
