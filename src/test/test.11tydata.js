// Fixture pages for developing the templates without a round trip through
// Obsidian and a Netlify deploy.
//
// `draft: true` is the whole safety mechanism: the drafts preprocessor drops a
// draft in production only, so these render on the dev deploy and on a local
// build and simply do not exist on wilnichols.com. Nothing else has to remember
// to delete them.
//
// `eleventyExcludeFromCollections` keeps them out of every index, the feed and
// the tag pages, so a fixture never shows up as a real post.
import { coordsFrom, placeTypes, visitedDisplay } from "../../lib/location-data.js";

export default function () {
  return {
    draft: true,
    eleventyExcludeFromCollections: true,
    author: "Fixture",
    tags: [],
    // The same derivations the real Locations directory data applies, so the
    // location fixture exercises the identical code path.
    eleventyComputed: {
      mapCoords: (data) => coordsFrom(data),
      placeTypes: (data) => placeTypes(data.tags),
      visitedDisplay: (data) => visitedDisplay(data.visited),
    },
  }
}
