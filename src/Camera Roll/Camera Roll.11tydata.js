import { DateTime } from 'luxon';
import { extract } from '@extractus/feed-extractor'
import Fetch from '@11ty/eleventy-fetch';
import { parse } from 'node-html-parser';

async function getAlbumContentsFromGlass() {
  let url = 'https://glass.photo/wilnichols/rss';
  const cameraRollArray = [];
  let cachePath = process.env.ELEVENTY_ENV === 'dev' ? '.cache' : '/opt/build/cache/';
  
  let feed;
  
  try {
    feed = await extract(url, {
      getExtraEntryFields: (feedEntry) => {
        const { enclosure } = feedEntry;
        return {
          enclosure: {
            url: enclosure['@_url']
          }
        };
      }
    });
  } catch (error) {
    console.error(`Failed to extract feed from ${url}:`, error);
    return []; // Exit early with an empty array if feed extraction fails
  }
  
  for (const entry of feed.entries) {
    try {
      let cameraRollEntry = {};
      const glassPage = await Fetch(entry.link, {
        duration: '*',
        type: 'xml',
        directory: cachePath,
      });
  
      const parsedGlassPage = parse(glassPage);
      const cameraSettings = parsedGlassPage.querySelector('.fa-loader')?.parentNode.nextSibling?.textContent.split(',');
      const rawDate = parsedGlassPage.querySelector('.fa-calendar')?.parentNode.nextSibling?.getAttribute('title');
      const isoDate = DateTime.fromFormat(rawDate, 'FF').toISO();

      cameraRollEntry = {
        key: entry.enclosure.url,
        lastModified: new Date(isoDate).toISOString(),
        meta: {
          url: entry.link,
          camera: {
            body: parsedGlassPage.querySelectorAll('a[href^="/explore/cameras"]')[0]?.textContent.trimEnd(),
            lens: parsedGlassPage.querySelectorAll('a[href^="/explore/lenses"]')[0]?.textContent
          },
          settings: {
            lens: cameraSettings?.[0]?.trimStart(),
            aperture: cameraSettings?.[1]?.trimStart(),
            shutter: cameraSettings?.[2]?.trimStart(),
            iso: cameraSettings?.[3]?.trimStart()
          },
          date: {
            raw: rawDate,
            ISO: isoDate,
            formatted: DateTime.fromISO(isoDate, 'FF')
          }
        }
      };
      
      // console.warn('fetching: ' + cameraRollEntry.key);
  
      cameraRollArray.push(cameraRollEntry);
    } catch (entryError) {
      console.error(`Error processing entry at ${entry.link}:`, entryError);
      continue;
    }
  }
  
  // Sort only valid entries
  const sortedCameraRoll = cameraRollArray.sort((a, b) =>
    a.meta.date.ISO < b.meta.date.ISO ? -1 : a.meta.date.ISO > b.meta.date.ISO ? 1 : 0
  );
  return sortedCameraRoll;
}

export default function (eleventy) {
  return {
    eleventyComputed: {
      photos: getAlbumContentsFromGlass()
    }
  }
}
