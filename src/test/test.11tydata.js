/* Fixtures for developing the templates without a round trip through Obsidian and
   a deploy. `draft: true` is the whole mechanism: production drops drafts, so these
   exist on the dev deploy and nowhere else. `eleventyExcludeFromCollections` keeps
   them out of the indexes, the feed and the tag pages. */
import { coordsFrom, placeTypes, visitedDisplay } from "../../lib/location-data.js";

export default function () {
  return {
    draft: true,
    eleventyExcludeFromCollections: true,
    author: "Fixture",
    tags: [],
    /* The same derivations the real Locations data applies, so the fixture
       exercises the identical code path. */
    eleventyComputed: {
      mapCoords: (data) => coordsFrom(data),
      placeTypes: (data) => placeTypes(data.tags),
      visitedDisplay: (data) => visitedDisplay(data.visited),
    },
  }
}
