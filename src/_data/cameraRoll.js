import { extract } from '@extractus/feed-extractor'
import Fetch from '@11ty/eleventy-fetch';
import { parse } from 'node-html-parser';

// it's lame that Glass's rss feed doesn't contain photos, but this works as long as they keep an identifiable main image on the page.
export default async function () {
  let url = 'https://glass.photo/wilnichols/rss';

  const feed = await extract(url)
  const cameraRollArray = [];
  for (const entry of feed.entries) {
    const cameraRollEntry = {};
    const glassPage = await Fetch(entry.link, {
      duration: '*',
      type: 'xml',
      directory: '/opt/build/cache/',
    });
    const parsedGlassPage = parse(glassPage);
    const photo = '.imageContent img';
    cameraRollEntry.src = parsedGlassPage.querySelector(photo).getAttribute('src');
    cameraRollEntry.srcset = parsedGlassPage.querySelector(photo).getAttribute('data-srcset');
    cameraRollArray.push(cameraRollEntry);
  };
  return cameraRollArray;
};
