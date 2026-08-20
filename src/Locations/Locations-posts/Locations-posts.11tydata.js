import { coordsFrom, placeTypes, visitedDisplay } from "../../../lib/location-data.js";

/* Markdown lives in the vault (Locations/); only this config is here.
   Derivations are in lib/location-data.js, shared with the test fixture. */
export default function () {
  return {
    permalink: "/locations/{{ page.fileSlug | slugify }}/index.html",
    tags: ["Locations", "Type/Location"],
    layout: "post.njk",
    postType: "location",
    postCollection: "Locations",
    eleventyComputed: {
      mapCoords: (data) => coordsFrom(data),
      placeTypes: (data) => placeTypes(data.tags),
      visitedDisplay: (data) => visitedDisplay(data.visited),
    },
  };
}
