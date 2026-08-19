import { coordsFrom, placeTypes, visitedDisplay } from "../../../lib/location-data.js";

// Places worth remembering. The markdown lives in the vault (Locations/) and is
// reached through the `notes` symlink; only this build config stays in the site
// repo, matching every other published type.
//
// The derivations live in lib/location-data.js so the /test/location fixture can
// use the same ones.
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
