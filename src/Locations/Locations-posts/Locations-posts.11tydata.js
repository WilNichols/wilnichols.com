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
      // Visited entries follow the same date convention as the site's `date:`
      // keys, and the time is optional:
      //   - 2026-08-15         a day
      //   - 2026-08-15T14:30   a day and a time
      // YAML makes that distinction for us: a bare date parses to a Date, while
      // `T14:30` (no seconds) stays a String, so nothing has to guess whether
      // midnight was meaningful.
      visitedDisplay: (data) =>
        (data.visited || [])
          .map((v) => {
            const isDate = v instanceof Date;
            const dt = isDate
              ? DateTime.fromJSDate(v, { zone: "utc" })
              : DateTime.fromISO(String(v).trim().replace(" ", "T"), { zone: "utc" });
            if (!dt.isValid) return null;
            // A Date came from a bare `2026-08-15`; a string only carries a time
            // if one was actually written.
            const hasTime = !isDate && /\d{1,2}:\d{2}/.test(String(v));
            return {
              // No offset on the timed form: the author writes local wall-clock
              // time, so stamping it `Z` would claim UTC and be a lie. A
              // datetime without an offset is valid HTML for local time.
              iso: hasTime ? dt.toFormat("yyyy-LL-dd'T'HH:mm") : dt.toISODate(),
              label: hasTime
                ? dt.toFormat("LLL d, yyyy 'at' h:mm a")
                : dt.toFormat("LLL d, yyyy"),
            };
          })
          .filter(Boolean),
    },
  };
}
