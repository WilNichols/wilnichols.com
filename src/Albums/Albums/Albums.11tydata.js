import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AssetCache } from '@11ty/eleventy-fetch';
import pLimit from 'p-limit';
import slugify from "@sindresorhus/slugify";

/* To flush one album's cache: rm .cache/aws_album_<key>.*   All of them: rm .cache/aws_album_* */

/* R2 owns what exists; the sidecar owns which photos, in what order, and any
   per-photo metadata. Tolerant in both directions: a new upload the sidecar has
   never heard of still appears, and an entry naming a file no longer in the bucket
   is dropped rather than rendering a broken image. */
function applyAlbumOrder(listed, order, meta = {}) {
  if (!Array.isArray(listed)) return listed;        // AWS failure string, or null
  const withMeta = (photo) => {
    const extra = meta?.[photo.fileName];
    return extra ? { ...photo, ...extra } : photo;
  };
  if (!Array.isArray(order) || order.length === 0) {
    return meta && Object.keys(meta).length ? listed.map(withMeta) : listed;
  }

  const byName = new Map(listed.map((p) => [p.fileName, p]));
  const out = [];
  for (const name of order) {
    const photo = byName.get(name);
    if (!photo) continue;                           // deleted from the bucket
    byName.delete(name);
    out.push(photo);
  }
  /* Anything unplaced keeps the bucket's order and goes last, so a new upload is
     visible without being silently promoted. */
  out.push(...byName.values());
  return out.map(withMeta);
}

const sessionCache = new Map();
const limit = pLimit(5);

async function getAlbumContentsFromAWS(key) {
  if (process.env.FAST) return null;

  if (sessionCache.has(key)) {
    console.log(`[album cache] session hit: ${key}`);
    return sessionCache.get(key);
  }

  const asset = new AssetCache(`aws_album_${key}`, ".cache", {
    filenameFormat: (uniqueKey) => `aws_album_${key}`,
  });

  if (asset.isCacheValid("1d")) {
    console.log(`[album cache] disk hit: ${key}`);
    const cached = await asset.getCachedValue();
    sessionCache.set(key, cached);
    return cached;
  }

  return limit(async () => {
    console.log('getting photos for ' + key);
    const client = new S3Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.WN_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.WN_AWS_SECRET_ACCESS_KEY
      }
    });
    const command = new ListObjectsV2Command({
      Bucket: 'wnphoto01',
      Delimiter: '/',
      Prefix: 'gallery-2023/' + key + '/'
    });

    let albums;
    try {
      const data = await client.send(command);
      data.Contents.forEach(image => image.Size > 30 * 1024 * 1024 && console.warn(image.Key + ' is above 30MB'));
      albums = data.Contents
        .slice(1)
        .map(({ Key, LastModified }) => ({
          key: Key,
          lastModified: LastModified,
          fileName: Key.split('/').pop(),
        }));
    } catch (error) {
      return 'AWS failure';
    }

    await asset.save(albums, "json");
    sessionCache.set(key, albums);
    console.log(`[album cache] created: ${key}`);
    return albums;
  });
}

export default function (eleventy) {
  return {
    // 11ty validates the merged data for every album and fails the build with
    // a useful message, so a malformed sidecar is caught here rather than
    // silently producing an album in the wrong order.
    eleventyDataSchema: function (data) {
      const { photoOrder, photoMeta } = data;
      if (photoOrder !== undefined) {
        if (!Array.isArray(photoOrder) || photoOrder.some(n => typeof n !== "string")) {
          throw new Error(`${data.page.inputPath}: photoOrder must be an array of filenames`);
        }
        const dupes = photoOrder.filter((n, i) => photoOrder.indexOf(n) !== i);
        if (dupes.length) {
          throw new Error(`${data.page.inputPath}: photoOrder lists ${dupes[0]} more than once`);
        }
      }
      if (photoMeta !== undefined && (typeof photoMeta !== "object" || Array.isArray(photoMeta))) {
        throw new Error(`${data.page.inputPath}: photoMeta must be an object keyed by filename`);
      }
    },
    layout: "album.njk",
    postType: "album",
    tags: ["Albums", "Topic/Photography"],
    eleventyComputed: {
      permalink: data => {
        const albumGroupTag = data.tags.find(tag => tag.includes("AlbumGroup"));
        const albumGroup = albumGroupTag ? slugify(albumGroupTag.replace('AlbumGroup/', '')) : '';
        const albumName = slugify(data.page.fileSlug).replace('-s', 's');
        const parts = ['albums', albumGroup, albumName].filter(Boolean);
        return '/' + parts.join('/') + '/'
      },
      groupPermalink: data => {
        const tag = data.tags?.find(t => t.startsWith("AlbumGroup/"));
        return tag ? `/albums/${slugify(tag.replace("AlbumGroup/", ""))}/` : null;
      },
      // R2 owns the inventory; the sidecar (<Album>.11tydata.json, written by
      // the Photo Album plugin) owns order and per-photo metadata.
      photos: async data => {
        if (!data.key) return null;
        const listed = await getAlbumContentsFromAWS(data.key);
        return applyAlbumOrder(listed, data.photoOrder, data.photoMeta);
      },
      metaPreview: data => data.remote.gallery.base + '/cdn-cgi/image/width=1400,format=webp/' + data.remote.gallery.photos + '/' + data.key + '/' + data.thumbnail,
      description: data => {
        const raw = data.page?.rawInput ?? '';
        const body = raw.replace(/^---[\s\S]*?---\n?/, '').trim();
        if (!body) return null;
        const text = body
          .replace(/<[^>]*>/g, '')
          .replace(/!\[.*?\]\(.*?\)/g, '')
          /* Wikilinks reach here verbatim, so a description leaked "[[Auvergne 6 |
             visit to Auzon]]" into every meta and og tag. Keep the display text,
             or the last path segment when the link is path-qualified. */
          .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, target, display) =>
            (display !== undefined ? display : target.split('/').pop()).trim())
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
          .replace(/[#*`_~]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (text.length <= 140) return text;
        return text.slice(0, 139).replace(/\s+\S*$/, '') + '…';
      }
    }
  }
}
