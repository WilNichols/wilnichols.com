import { DateTime } from 'luxon';
import { extract } from '@extractus/feed-extractor'
import Fetch from '@11ty/eleventy-fetch';
import { parse } from 'node-html-parser';

async function getAlbumContentsFromGlass() {
  const url = 'https://glass.photo/wilnichols/rss';
  const cachePath = process.env.ELEVENTY_ENV === 'dev' ? '.cache' : '/opt/build/cache/';
  const cameraRollArray = [];

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
    return [];
  }

  for (const entry of feed.entries) {
    try {
      const glassPage = await Fetch(entry.link, {
        duration: '*',
        type: 'text',
        directory: cachePath,
      });

      const parsedGlassPage = parse(glassPage);
      const cameraSettings = parsedGlassPage.querySelector('.fa-loader')?.parentNode.nextSibling?.textContent.split(',');
      const formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const rawDate = formatter.format(new Date(entry.published));
      const isoDate = DateTime.fromFormat(rawDate, 'FF').toISO();

      cameraRollArray.push({
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
      });
    } catch (entryError) {
      console.error(`Error processing entry at ${entry.link}:`, entryError);
      continue;
    }
  }

  return cameraRollArray.sort((a, b) =>
    a.meta.date.ISO < b.meta.date.ISO ? -1 : a.meta.date.ISO > b.meta.date.ISO ? 1 : 0
  );
}

export default function (eleventy) {
  return {
    eleventyComputed: {
      photos: getAlbumContentsFromGlass()
    }
  }
}
