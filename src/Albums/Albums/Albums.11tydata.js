import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AssetCache } from '@11ty/eleventy-fetch';
import pLimit from 'p-limit';
import slugify from "@sindresorhus/slugify";

/* To flush one album's cache: rm .cache/aws_album_<key>.*   All of them: rm .cache/aws_album_* */

/* The bucket owns what exists; the sidecar owns order and per-photo metadata.
   Tolerant both ways: unknown uploads still appear, missing files are dropped. */
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
  /* Unplaced photos keep bucket order and go last. */
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
    /* Fail loudly: a malformed sidecar would otherwise reorder an album silently. */
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
      /* Sidecar is <Album>.11tydata.json, written by the Photo Album plugin. */
      photos: async data => {
        if (!data.key) return null;
        const listed = await getAlbumContentsFromAWS(data.key);
        return applyAlbumOrder(listed, data.photoOrder, data.photoMeta);
      },
      metaPreview: data => data.remote.gallery.base + '/cdn-cgi/image/width=1400,format=webp/' + data.remote.gallery.photos + '/' + data.key + '/' + data.thumbnail,
      description: function (data) { return this.excerpt(data.page?.rawInput); },
    }
  }
}
