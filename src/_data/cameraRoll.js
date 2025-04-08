import { DateTime } from 'luxon';
import { extract } from '@extractus/feed-extractor'
import Fetch from '@11ty/eleventy-fetch';
import { parse } from 'node-html-parser';


export default async function () {
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
      const cameraRollEntry = {};
      const glassPage = await Fetch(entry.link, {
        duration: '*',
        type: 'xml',
        directory: cachePath,
      });

      const parsedGlassPage = parse(glassPage);
      cameraRollEntry.url = entry.link;
      cameraRollEntry.img = { src: entry.enclosure.url };
      cameraRollEntry.camera = {
        body: parsedGlassPage.querySelectorAll('a[href^="/explore/cameras"]')[0]?.textContent.trimEnd(),
        lens: parsedGlassPage.querySelectorAll('a[href^="/explore/lenses"]')[0]?.textContent
      };

      const cameraSettings = parsedGlassPage.querySelector('.fa-loader')?.parentNode.nextSibling?.textContent.split(',');
      cameraRollEntry.settings = {
        lens: cameraSettings?.[0]?.trimStart(),
        aperture: cameraSettings?.[1]?.trimStart(),
        shutter: cameraSettings?.[2]?.trimStart(),
        iso: cameraSettings?.[3]?.trimStart()
      };

      const rawDate = parsedGlassPage.querySelector('.fa-calendar')?.parentNode.nextSibling?.getAttribute('title');
      const isoDate = DateTime.fromFormat(rawDate, 'FF').toISO();
      cameraRollEntry.date = {
        raw: rawDate,
        ISO: isoDate,
        formatted: DateTime.fromISO(isoDate, 'FF')
      };

      console.warn('fetching: ' + cameraRollEntry.img.src);

      const img = await Fetch(cameraRollEntry.img.src, {
        duration: '*',
        type: 'buffer',
        directory: cachePath,
        fetchOptions: {
          signal: AbortSignal.timeout(300000),
        },
      });

      cameraRollArray.push(cameraRollEntry);
    } catch (entryError) {
      console.error(`Error processing entry at ${entry.link}:`, entryError);
      continue;
    }
  }

  // Sort only valid entries
  const sortedCameraRoll = cameraRollArray.sort((a, b) =>
    a.date.ISO < b.date.ISO ? -1 : a.date.ISO > b.date.ISO ? 1 : 0
  );

  return sortedCameraRoll;
};
