// Places worth remembering. The markdown lives in the vault (Locations/) and is
// reached through the `notes` symlink; only this build config stays in the site
// repo, matching every other published type.
//
// A location authors: `date` (added), an optional `visited:` list of dates, a
// `map:` Google Maps link, an optional `website:`, and `Place/<Type>` tags for
// its kind. The pin is derived from the maps link when it carries coordinates
// (a full desktop maps URL does); a `coordinates: "lat, lng"` key overrides that
// for shortened links that don't.

import { DateTime } from "luxon";

function coordsFrom(data) {
  const explicit = data.coordinates;
  if (Array.isArray(explicit) && explicit.length === 2) return explicit.map(Number);
  if (typeof explicit === "string") {
    const m = explicit.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) return [Number(m[1]), Number(m[2])];
  }
  const url = String(data.map || "");
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,               // .../@48.8526,2.3471,17z
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,           // place data blob
    /[?&](?:q|ll|query|center|destination|daddr|sll)=(-?\d+\.\d+),(-?\d+\.\d+)/, // q=lat,lng
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return [Number(m[1]), Number(m[2])];
  }
  return null;
}

export default function () {
  return {
    permalink: "/locations/{{ page.fileSlug | slugify }}/index.html",
    tags: ["Locations", "Type/Location"],
    layout: "post.njk",
    postType: "location",
    postCollection: "Locations",
    eleventyComputed: {
      // [lat, lng] for the map pin, or null when the link has no coordinates.
      mapCoords: (data) => coordsFrom(data),
      // Place/<Type> tags, surfaced as plain type names for display and filtering.
      placeTypes: (data) =>
        (data.tags || [])
          .filter((t) => typeof t === "string" && t.startsWith("Place/"))
          .map((t) => t.slice("Place/".length)),
      // Normalise the visited list (YAML may hand us Date objects or strings)
      // into { iso, label } so the template stays dumb.
      visitedDisplay: (data) =>
        (data.visited || [])
          .map((v) => (v instanceof Date
            ? DateTime.fromJSDate(v, { zone: "utc" })
            : DateTime.fromISO(String(v), { zone: "utc" })))
          .filter((dt) => dt.isValid)
          .map((dt) => ({ iso: dt.toISODate(), label: dt.toFormat("LLL d, yyyy") })),
    },
  };
}
