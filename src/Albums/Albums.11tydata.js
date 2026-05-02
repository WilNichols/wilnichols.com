import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AssetCache } from '@11ty/eleventy-fetch';
import slugify from "@sindresorhus/slugify";

// To flush a single album's cache: rm .cache/aws_album_<key>.*
// To flush all album caches: rm .cache/aws_album_*

const sessionCache = new Map();

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
}

export default function (eleventy) {
  return {
    layout: "album.njk",
    tags: ["Albums", "Topic/Photography"],
    eleventyComputed: {
      permalink: data => '/albums/' + slugify(data.page.fileSlug).replace('-s', 's') + '/',
      photos: async data => data.key ? getAlbumContentsFromAWS(data.key) : null
    }
  }
}
