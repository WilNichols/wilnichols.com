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
import { plainText } from './lib/plain-text.js';
import { imageSize } from 'image-size';
import slugify from "@sindresorhus/slugify";
import pluginRss from '@11ty/eleventy-plugin-rss';
import beautify from 'js-beautify';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import { JSDOM } from 'jsdom';
import util from 'util';

dotenv.config();

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
            /* Vault links are path-qualified ([[Photography/Albums/Paris 4|Paris]]),
               because Obsidian resolves those deterministically instead of guessing
               by folder proximity. Permalinks are flat, and slugify turns "/" into
               "-", so slugifying the whole target yields /photography-albums-paris-4/.
               Resolve on the last segment. */
            const target = parts[0].trim().split("/").pop().trim();
            match.url = `/` + slugify(`${target.replace(/\s/g, "-")}/`).replace('-s', 's') + `/`;
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
  
  /* Anywhere a note's own text is emitted as text rather than rendered as HTML,
     it needs stripping first: summaries reach RSS <description> and index cards
     verbatim, so an authored [[wikilink]] would ship as source. */
  eleventyConfig.addFilter("plainText", plainText);

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
  
  // Filters
  
  eleventyConfig.addFilter("getPhoto", function (key) {
    const photos = this.ctx.collections?.photos;
    return photos[key];
  });

  eleventyConfig.addFilter("getNestedTag", function (tags, prefix) {
    prefix = prefix + '/';
    const nestedTag = tags.filter(s => s.startsWith(prefix))
    return nestedTag.toString().replace(prefix, '');
  });

  const linksCache = new Map();
  eleventyConfig.addFilter("links_to", async function(collection, target) {
    const hostname = "wilnichols.com";
    function getLinks(html) {
        if (linksCache.has(html)) return linksCache.get(html);
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const result = new Set([...document.querySelectorAll("a[href]")]
            .map(x => {
                let href = x.getAttribute("href");
                const url = new URL(href, `https://${hostname}`);
                if (url.hostname == hostname) return url.pathname;
                url.hash = "";
                return url.toString();
            }));
        linksCache.set(html, result);
        return result;
    }
    return collection.filter(item => {
      try { return getLinks(item.content).has(target); }
      catch { return false; }
    });
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
  
  // https://stackoverflow.com/questions/66083103/how-to-generate-a-list-of-all-collections-in-11ty
  eleventyConfig.addCollection("albumGroups", function(collectionsApi) {
      const albumGroups = [];
      collectionsApi.getAll().map( item => {
          if (item.data.tags) { // handle pages that don't have tags
              item.data.tags
                .filter(tag => tag.startsWith('AlbumGroup/'))
                .map(tag => {
                  if (!albumGroups.includes(tag)) {
                    albumGroups.push(tag);
                  }
                });
          }
      });
      return albumGroups;
  });
  
  eleventyConfig.addCollection("glassPhotos", async (collectionsApi) => {
    // we sent these to a collection b/c njk templates can't read straight from eleventyComputed
    const allItems = collectionsApi.getFilteredByTag("cameraRollSource");
    console.log(`[glassPhotos] resolving ${allItems.length} cameraRollSource items`);
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
    console.log(`[glassPhotos] resolved ${glassPhotos.length} photos, ~${Math.round(JSON.stringify(glassPhotos).length / 1024)}KB`);
    return glassPhotos;
  });

  eleventyConfig.addCollection("photos", async () => {
    const base = "https://img.nkls.me";
    console.log(`[photos] fetching from ${base}`);
    const [photosResp, rollResp] = await Promise.all([
      fetch(`${base}/api/photos`),
      fetch(`${base}/api/camera-roll`),
    ]);
    if (!photosResp.ok) throw new Error(`Photo service ${photosResp.status}`);
    if (!rollResp.ok) throw new Error(`Camera roll service ${rollResp.status}`);
    const [photos, roll] = await Promise.all([photosResp.json(), rollResp.json()]);
    const merged = { ...photos, ...roll };
    console.log(`[photos] loaded ${Object.keys(merged).length} entries, ~${Math.round(JSON.stringify(merged).length / 1024)}KB`);
    return merged;
  });
  
  eleventyConfig.addCollection("Feed", function (collectionsApi) {
    const feed = [
      ...collectionsApi.getFilteredByTag("Type/Case Study"),
      ...collectionsApi.getFilteredByTag("Type/Note"),
      ...collectionsApi.getFilteredByTag("Type/Link"),
      ...collectionsApi.getFilteredByTag("Type/Recipe"),
      ...collectionsApi.getFilteredByTag("Type/Location"),
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
  
  eleventyConfig.addFilter("designInputFilter", function (collection) {
    return collection.map(item => {
      const filter = item.data.inputFilter;

      if (filter === "Pointer") return "desktop";
      if (filter === "Coarse") return "mobile";
      return "shared";
    });
  });

  /* Fixture work entries live in collections.Design so the carousel can group them
     by their own tag, which means the home page has to reject them. */
  eleventyConfig.addFilter("notFixtures", (collection) =>
    (collection ?? []).filter((item) => !item.data?.fixture));
  eleventyConfig.addFilter("onlyFixtures", (collection) =>
    (collection ?? []).filter((item) => item.data?.fixture));

  eleventyConfig.addFilter("draftsOf", (collection1, collection2) => {
    return collection1.filter(value => collection2.includes(value));
  });

  // Design posts are authored as one body: the shot markup followed by
  // <div class="content">…</div>. These split that body so the shot can
  // render inside the carousel while the description renders outside it
  // (wheel over a description must reach the page, not the scroller).
  const CONTENT_SPLIT = '<div class="content">';
  eleventyConfig.addFilter("shotOnly", html =>
    html ? html.split(CONTENT_SPLIT)[0] : html
  );
  eleventyConfig.addFilter("contentOnly", html => {
    if (!html) return '';
    const i = html.indexOf(CONTENT_SPLIT);
    return i === -1 ? '' : html.slice(i);
  });
  
  eleventyConfig.addFilter("markdownify", string => {
    return md.renderInline(string)
  });

  // CDN URL builders (Cloudflare migration). Host comes from KXCDN so the
  // D5 flip back to cdn.dznr.me is one .env change.
  const CDN_HOST = process.env.KXCDN || "https://cdn.dznr.me";
  // cdnUrl: cdn-relative path -> absolute CDN URL (no transform; videos, raw)
  eleventyConfig.addFilter("cdnUrl", path => `${CDN_HOST}/${path}`);
  // cfImage: absolute-or-relative image -> Cloudflare transform URL.
  // width omitted = format conversion only. Old ?query forms must be gone
  // from the input; options live in the path segment now. Any known CDN host
  // prefix is stripped so callers can pass legacy absolute URLs safely.
  const CDN_HOSTS = ["https://cdn.dznr.me", "https://cdn2.dznr.me", CDN_HOST];
  eleventyConfig.addFilter("cfImage", (src, width) => {
    const opts = width ? `width=${width},format=webp` : `format=webp`;
    let path = src;
    for (const h of CDN_HOSTS) {
      if (path.startsWith(`${h}/`)) { path = path.slice(h.length + 1); break; }
    }
    return `${CDN_HOST}/cdn-cgi/image/${opts}/${path}`;
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

  const siblingDate = (item) => item.data?.sortDate ?? item.date;

  eleventyConfig.addFilter("sortBySiblingDate", (collection) =>
    [...(collection ?? [])].sort((a, b) => siblingDate(a) - siblingDate(b))
  );

  eleventyConfig.addFilter("sortByAlbumGroup", (albums) => {
    const getGroup = (album) => album.data.tags?.find(t => t.startsWith("AlbumGroup/")) ?? "";
    const groupDates = {};
    for (const album of albums) {
      const group = getGroup(album);
      if (!groupDates[group] || album.date > groupDates[group]) groupDates[group] = album.date;
    }
    return [...albums].sort((a, b) => {
      const ga = getGroup(a), gb = getGroup(b);
      if (ga !== gb) {
        const dateDiff = (groupDates[gb] ?? 0) - (groupDates[ga] ?? 0);
        return dateDiff !== 0 ? dateDiff : ga.localeCompare(gb);
      }
      return siblingDate(b) - siblingDate(a);
    });
  });

  const isGroupIntro = (item) => item.data?.tags?.includes("AlbumGroupIntro");

  eleventyConfig.addFilter("excludeGroupIntros", (collection) =>
    (collection ?? []).filter(item => !isGroupIntro(item))
  );

  eleventyConfig.addFilter("groupIntro", (collection) =>
    (collection ?? []).find(isGroupIntro) ?? null
  );

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  eleventyConfig.addFilter('hasContent', (post) => {
    try { return !!post.content; } catch { return false; }
  });

  eleventyConfig.addFilter('safeContent', (post) => {
    try { return post.content ?? ''; } catch { return ''; }
  });

  eleventyConfig.addFilter('log', (value) => {
    // console.log('\x1b[37m', [...value]);
    console.log(util.inspect(value, { maxArrayLength: null }))
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
    liveReload: true,
    port: process.env.PORT ? Number(process.env.PORT) : 8080
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
  
  // Private notes live in the vault beside published ones. Unlike drafts, they
  // are dropped in every environment, including branch and preview deploys.
  eleventyConfig.addPreprocessor("private", "*", (data, content) => {
    if (data.private) {
      return false;
    }
  });

  // Photos dragged out of the Photo Albums plugin land as ordinary markdown
  // images pointing at the CDN, so they stay portable and Obsidian previews
  // them. Here they are upgraded to the Picture macro, which supplies the
  // responsive srcset, ratio and average colour from collections.photos.
  //
  // This has to be a preprocessor rather than a markdown-it rule: with
  // markdownTemplateEngine set to njk, Nunjucks runs *before* markdown, so a
  // renderer rule would emit final HTML too late to call a macro.
  const CDN_IMAGE = /!\[([^\]]*)\]\((https:\/\/cdn(?:2)?\.dznr\.me\/[^)\s]+)\)/g;
  const PICTURE_IMPORT = '{% from "picture.njk" import Picture with context %}';

  eleventyConfig.addPreprocessor("cdn-images", "md", (data, content) => {
    if (!CDN_IMAGE.test(content)) return;
    CDN_IMAGE.lastIndex = 0;

    const upgraded = content.replace(CDN_IMAGE, (_m, alt, src) => {
      const a = String(alt).replace(/"/g, "&quot;");
      return `{{ Picture(src="${src}", alt="${a}", isWNCDN=true) }}`;
    });

    // Import once, and only if the note does not already pull the macro in.
    return content.includes("import Picture")
      ? upgraded
      : `${PICTURE_IMPORT}\n${upgraded}`;
  });

  // Recipes mark where the ingredients table belongs with a bare
  // `{% ingredients %}` token, expanded here into the ingredients macro so notes
  // never hand-write a renderTemplate block. Runs before Nunjucks, same as
  // cdn-images, so the injected macro call renders normally afterwards.
  //
  // The rows are authored as an ordinary markdown table directly under the
  // token. That is the one shape Obsidian both renders and *edits* natively —
  // its table editor gives real cells, tab navigation and row/column controls,
  // where a frontmatter list of {name, imperial, metric} objects is barely
  // editable in the properties panel. The table is consumed here, so it never
  // reaches the page as a plain markdown table; the macro owns the markup.
  //
  // A token with no table after it still falls back to a frontmatter
  // `ingredients:` list, so either authoring style builds.
  const INGREDIENTS_IMPORT =
    '{% from "ingredients.njk" import ingredientsList with context %}';
  // token, optional blank lines, then one or more contiguous pipe-table lines
  // Either marker works: `%%ingredients%%` is an Obsidian comment, so it stays
  // invisible in reading mode, while `{% ingredients %}` reads like the rest of
  // the site's templating. Both are consumed here.
  const TOKEN_SRC = "(?:\\{%\\s*ingredients\\s*%\\}|%%\\s*ingredients\\s*%%)";
  const INGREDIENTS_WITH_TABLE = new RegExp(
    TOKEN_SRC + "[ \\t]*\\n\\s*\\n?((?:[ \\t]*\\|[^\\n]*\\n?)+)", "g");
  const INGREDIENTS_TOKEN = new RegExp(TOKEN_SRC, "g");

  // "| a | b | c |" -> ["a","b","c"], tolerating missing outer pipes.
  const tableCells = (line) =>
    line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const isSeparator = (line) => /^[\s|:-]+$/.test(line) && line.includes("-");

  // A pipe table -> the ingredients macro call, rows carried as a JSON literal.
  const expandTable = (table) => {
    const rows = table.split("\n").filter((l) => l.trim().startsWith("|"));
    const body = rows.filter((l) => !isSeparator(l));
    // Drop the header row only when the table actually declared one, which a
    // separator line is the marker for.
    const hasHeader = rows.some(isSeparator);
    const dataRows = (hasHeader ? body.slice(1) : body)
      .map(tableCells)
      .filter((cells) => cells.some(Boolean))
      .map(([name, imperial, metric]) => ({
        name: name ?? "",
        imperial: imperial ?? "",
        metric: metric ?? "",
      }));
    /* The trailing newline is load-bearing. The table match consumes the newline
       that ended its last row, and the macro renders to a block element, so
       without it markdown-it keeps swallowing the rest of the document as part of
       that HTML block: the whole Directions section came out as raw markdown. */
    if (!dataRows.length) return `${INGREDIENTS_IMPORT}{{ ingredientsList(ingredients) }}\n`;
    /* JSON is a valid Nunjucks literal, and JSON.stringify handles the quoting so
       an ingredient name may contain apostrophes or quotes safely. */
    return `${INGREDIENTS_IMPORT}{{ ingredientsList(${JSON.stringify(dataRows)}) }}\n`;
  };

  // With no marker at all, a recipe's ingredients table is found by its own
  // header: the first table whose first column is "Ingredient(s)". The table
  // therefore declares what it is, and a recipe needs no site-specific syntax.
  // Scoped to postType `recipe`, which the data cascade has already resolved by
  // the time a preprocessor runs.
  const BARE_TABLE = /^[ \t]*\|[^\n]*\n[ \t]*\|[\s|:-]+\|[ \t]*\n(?:[ \t]*\|[^\n]*\n?)*/gm;

  eleventyConfig.addPreprocessor("recipe-ingredients", "md", (data, content) => {
    const marked = INGREDIENTS_TOKEN.test(content);
    INGREDIENTS_TOKEN.lastIndex = 0;

    // No marker: take the first table that calls itself an ingredients table.
    if (!marked) {
      if (data.postType !== "recipe") return;
      BARE_TABLE.lastIndex = 0;
      // Every table, not just the first: a recipe may lead with something else.
      for (const m of content.matchAll(BARE_TABLE)) {
        const header = tableCells(m[0].split("\n")[0]);
        if (!/^ingredients?$/i.test(header[0] ?? "")) continue;
        return content.replace(m[0], expandTable(m[0]));
      }
      return;
    }

    let out = content.replace(INGREDIENTS_WITH_TABLE, (_m, table) => {
      return expandTable(table);
    });

    // Any token that had no table under it falls back to frontmatter.
    INGREDIENTS_TOKEN.lastIndex = 0;
    out = out.replace(
      INGREDIENTS_TOKEN,
      `${INGREDIENTS_IMPORT}{{ ingredientsList(ingredients) }}\n`
    );
    return out;
  });

  /* A pen names its code samples where they appear in the prose:

       ```site-code
       src/static/css/pens/fading-list.scss
       title: SCSS
       ```

     One file becomes a standalone highlighted block. Two or more become the
     tabbed presentation, which is what the two multi-file pens already used, with
     `id:` naming the anchor. Paths are written repo-relative, because that is what
     the Obsidian plugin needs to find the file on disk or over HTTP; the macro's
     `{% include %}` resolves from _includes, so the leading `src/` is swapped for
     `../` here. `lang` defaults to the file extension.

     The companion ```site-embed fence is Obsidian-only: the site renders the demo
     from the note's `hero:`, so it is stripped with the other vault-only blocks. */
  const SITE_CODE = /^[ \t]*```site-code[ \t]*\n([\s\S]*?)^[ \t]*```[ \t]*$\n?/gm;
  const CODE_IMPORTS =
    '{% from "highlight.njk" import highlight with context %}' +
    '{% from "tabs.njk" import tabs with context %}';

  eleventyConfig.addPreprocessor("pen-code", "md", (data, content) => {
    if (!SITE_CODE.test(content)) return;
    SITE_CODE.lastIndex = 0;
    return content.replace(SITE_CODE, (_m, body) => {
      const lines = String(body).split("\n").map((l) => l.trim()).filter(Boolean);
      let id = "markup";
      const files = [];
      for (const line of lines) {
        const kv = line.match(/^(id|title|lang):\s*(.*)$/i);
        if (kv) {
          const key = kv[1].toLowerCase();
          if (key === "id") { id = kv[2].trim(); continue; }
          if (files.length) files[files.length - 1][key] = kv[2].trim();
          continue;
        }
        files.push({ path: line });
      }
      if (!files.length) return "";

      const tabsList = files.map((f) => ({
        type: "code",
        title: f.title ?? "",
        lang: f.lang ?? (f.path.split(".").pop() ?? ""),
        src: f.path.replace(/^src\//, "../"),
      }));

      /* The trailing newline matters: the fence match consumes the one after the
         closing ```, and without it the next paragraph is absorbed into the
         macro's HTML block instead of being wrapped in its own <p>. */
      if (tabsList.length === 1) {
        const t = tabsList[0];
        return `${CODE_IMPORTS}{{ highlight(${JSON.stringify(t)}, standalone = true, title = ${JSON.stringify(t.title)}) }}\n`;
      }
      // Tabs: each pane is the same macro with standalone off, in order.
      const panes = tabsList
        .map((t) => `{% set _p %}{{ highlight(${JSON.stringify(t)}, standalone = false) }}{% endset %}{% set _panes = (_panes.push(_p), _panes) %}`)
        .join("");
      return `${CODE_IMPORTS}{% set _panes = [] %}${panes}` +
             `{{- tabs(${JSON.stringify(id)}, ${JSON.stringify(tabsList)}, _panes) -}}\n`;
    });
  });

  /* A case study places a figure by name:

       ```site-figure
       FS2Board
       ```

     The file defaults to `unique/case-study--<note slug>.njk`, which is where
     every case study's figures live. `file:` overrides it for the one figure that
     is shared across two case studies. Figures take no arguments; they exist so a
     note can say "the board goes here" without carrying the markup. */
  const SITE_FIGURE = /^[ \t]*```site-figure[ \t]*\n([\s\S]*?)^[ \t]*```[ \t]*$\n?/gm;

  eleventyConfig.addPreprocessor("case-study-figures", "md", (data, content) => {
    if (!SITE_FIGURE.test(content)) return;
    SITE_FIGURE.lastIndex = 0;
    const slug = slugify(String(data.page?.fileSlug ?? ""));
    return content.replace(SITE_FIGURE, (_m, body) => {
      const lines = String(body).split("\n").map((l) => l.trim()).filter(Boolean);
      const name = lines[0];
      if (!name) return "";
      const override = lines.find((l) => l.toLowerCase().startsWith("file:"));
      const file = override
        ? override.slice(5).trim()
        : `unique/case-study--${slug}.njk`;
      return `{% from ${JSON.stringify(file)} import ${name} with context %}` +
             `{{ ${name}() | mdRenderNJK | safe }}\n`;
    });
  });

  // Vault-only furniture: folder-note card views, the map preview a Location note
  // shows while editing, the inline photo grid on an album note, and an embedded
  // Bases view such as the Locations map. Obsidian
  // renders these; the site never should — it has no Dataview, and the album grid
  // is drawn by a plugin — so they would otherwise publish as raw code blocks.
  // Stripped here so a note can carry an Obsidian affordance without it leaking
  // into the build.
  const VAULT_BLOCK =
    /^[ \t]*```(?:dataview(?:js)?|album-photos|base|site-embed|site-shot|site-hero)[ \t]*\n[\s\S]*?^[ \t]*```[ \t]*$\n?/gm;
  eleventyConfig.addPreprocessor("strip-vault-blocks", "md", (data, content) => {
    if (!VAULT_BLOCK.test(content)) return;
    VAULT_BLOCK.lastIndex = 0;
    return content.replace(VAULT_BLOCK, "");
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
