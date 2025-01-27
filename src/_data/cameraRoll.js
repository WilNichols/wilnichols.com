import { extract } from '@extractus/feed-extractor'
import ExifReader from 'exifreader';
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
    
    const img = await Fetch(cameraRollEntry.img.src, {
      duration: '*',
      type: 'buffer',
      directory: '/opt/build/cache/',
    });
    const exifTags = await ExifReader.load(img);
    cameraRollEntry.date = exifTags.CreateDate.description;
    cameraRollArray.push(cameraRollEntry);
  };
  const sortedCameraRoll = cameraRollArray.sort(function(a, b) {
    return (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0);
  });
  return sortedCameraRoll;
};
