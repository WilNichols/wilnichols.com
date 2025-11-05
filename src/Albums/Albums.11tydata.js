import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import slugify from "@sindresorhus/slugify";


async function test(key) {
  // console.log(key);
  if (!process.env.FAST) {
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
      Prefix: 'gallery-2023/' + key + '/'
    };
    
    const command = new ListObjectsV2Command(albumsParams);
    let data;
    let albums;
    try {
      data = await client.send(command);
      albums = data.Contents
        .slice(1)
        .map(({ Key, LastModified }) => ({ key: Key, lastModified: LastModified }));
      // vcheck image size and report those over 30megabytes bc they'll fail to trasfrorm
      data.Contents.forEach(image => image.Size > 30 * 1024 * 1024 && console.warn(image.Key + ' is above 30MB'))
    } catch (error) {
      return 'AWS failure'
    } finally {
      return albums;
    }
  } else {
    return null;
  }
}

export default function (eleventy) {
  return {
    layout: "album.njk",
    tags: ["Albums", "Topic/Photography"],
    eleventyComputed: {
      permalink: data => '/albums/' + slugify(data.page.fileSlug).replace('-s', 's') + '/',
      photos: async data => test(data.key)
    }
  }
}
