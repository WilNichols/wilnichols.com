import { applyAlbumOrder } from '../../../lib/album-order.js';
import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AssetCache } from '@11ty/eleventy-fetch';
import pLimit from 'p-limit';
import slugify from "@sindresorhus/slugify";

/* To flush one album's cache: rm .cache/aws_album_<key>.*   All of them: rm .cache/aws_album_* */

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
        return applyAlbumOrder(listed, data.photoOrder);
      },
      metaPreview: data => data.remote.gallery.base + '/cdn-cgi/image/width=1400,format=webp/' + data.remote.gallery.photos + '/' + data.key + '/' + data.thumbnail,
      description: function (data) { return this.excerpt(data.page?.rawInput); },
    }
  }
}
