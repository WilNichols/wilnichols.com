import { DateTime } from 'luxon';
import { extract } from '@extractus/feed-extractor'
import Fetch from '@11ty/eleventy-fetch';
import { parse } from 'node-html-parser';

// it's lame that Glass's rss feed doesn't contain photos, but this works as long as they keep an identifiable main image on the page.
export default async function () {
  let url = 'https://glass.photo/wilnichols/rss';
  const feed = await extract(url)
  const cameraRollArray = [];
  let cachePath;
  if (process.env.ELEVENTY_ENV == 'prod') {
   cachePath = '/opt/build/cache/'
  } else if (process.env.ELEVENTY_ENV == 'dev') {
    cachePath = '.cache'
  };
  
  for (const entry of feed.entries) {
    const cameraRollEntry = {};
    const glassPage = await Fetch(entry.link, {
      duration: '*',
      type: 'xml',
      directory: cachePath,
    });
    const parsedGlassPage = parse(glassPage);
    const photo = '.imageContent img';
    // this is _incredibly_ brittle, but it looks like they strip a ton of exif data
    cameraRollEntry.url = entry.link;
    cameraRollEntry.img = {};
    cameraRollEntry.img.src = parsedGlassPage.querySelector(photo).getAttribute('src');
    cameraRollEntry.img.srcset = parsedGlassPage.querySelector(photo).getAttribute('data-srcset');
    cameraRollEntry.camera = {};
    cameraRollEntry.camera.body = parsedGlassPage.querySelectorAll('a[href^="/explore/cameras"]')[0].textContent.trimEnd();
    cameraRollEntry.camera.lens = parsedGlassPage.querySelectorAll('a[href^="/explore/lenses"]')[0].textContent;
    const cameraSettings = parsedGlassPage.querySelector('.fa-loader').parentNode.nextSibling.textContent.split(",");
    cameraRollEntry.settings = {};
    cameraRollEntry.settings.lens = cameraSettings[0].trimStart();
    cameraRollEntry.settings.aperture = cameraSettings[1].trimStart();
    cameraRollEntry.settings.shutter = cameraSettings[2].trimStart();
    cameraRollEntry.settings.iso = cameraSettings[3].trimStart();
    cameraRollEntry.date = {};
    cameraRollEntry.date.raw = parsedGlassPage.querySelector('.fa-calendar').parentNode.nextSibling.getAttribute('title');
    cameraRollEntry.date.ISO = DateTime.fromFormat(cameraRollEntry.date.raw, 'FF').toISO();
    cameraRollEntry.date.formatted = DateTime.fromISO(cameraRollEntry.date.ISO, 'FF');
    const img = await Fetch(cameraRollEntry.img.src, {
      duration: '*',
      type: 'buffer',
      directory: cachePath,
    });
    cameraRollArray.push(cameraRollEntry);
  };
  const sortedCameraRoll = cameraRollArray.sort(function(a, b) {
    return (a.date.ISO < b.date.ISO) ? -1 : ((a.date.ISO > b.date.ISO) ? 1 : 0);
  });
  return sortedCameraRoll;
};
