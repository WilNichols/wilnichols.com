/* Derivations a Location page needs, shared by the Locations directory data and
   the /test/location fixture so there is one implementation rather than two that
   drift. */
import { DateTime } from "luxon";

function coordsFrom(data) {
  // `location` is the key Obsidian's Maps plugin reads to place a pin, so it is
  // the canonical one and the site follows it rather than inventing a second.
  // `coordinates` is kept as an older alias. Both accept "lat, lng" or [lat, lng].
  for (const explicit of [data.location, data.coordinates]) {
    if (Array.isArray(explicit) && explicit.length === 2) {
      const pair = explicit.map(Number);
      if (pair.every((n) => Number.isFinite(n))) return pair;
    }
    if (typeof explicit === "string") {
      const m = explicit.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (m) return [Number(m[1]), Number(m[2])];
    }
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

/* Visited entries follow the same date convention as the site's `date:` keys, and
   the time is optional. YAML makes the distinction: a bare date parses to a Date,
   while `T14:30` (no seconds) stays a String, so nothing has to guess whether
   midnight was meaningful. */
export function visitedDisplay(visited) {
  const list = Array.isArray(visited) ? visited : visited ? [visited] : [];
  return list
    .map((v) => {
      const isDate = v instanceof Date;
      const dt = isDate
        ? DateTime.fromJSDate(v, { zone: "utc" })
        : DateTime.fromISO(String(v).trim().replace(" ", "T"), { zone: "utc" });
      if (!dt.isValid) return null;
      const hasTime = !isDate && /\d{1,2}:\d{2}/.test(String(v));
      return {
        // No offset on the timed form: the author writes local wall-clock time,
        // so stamping it `Z` would claim UTC and be a lie.
        iso: hasTime ? dt.toFormat("yyyy-LL-dd'T'HH:mm") : dt.toISODate(),
        label: hasTime ? dt.toFormat("LLL d, yyyy 'at' h:mm a") : dt.toFormat("LLL d, yyyy"),
      };
    })
    .filter(Boolean);
}

export function placeTypes(tags) {
  return (tags || [])
    .filter((t) => typeof t === "string" && t.startsWith("Place/"))
    .map((t) => t.slice("Place/".length));
}

export { coordsFrom };
