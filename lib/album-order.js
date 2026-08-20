/* The bucket owns what exists; the sidecar (<Album>.11tydata.json, written by the
   Photo Albums plugin) owns the order. Tolerant both ways: unknown uploads still
   appear, and an entry naming a file no longer in the bucket is dropped.

   A lib module rather than an export from Albums.11tydata.js: importing one
   directory data file from another stops 11ty applying it, so every album loses
   its layout and permalink and builds as a bare fragment. */
export function applyAlbumOrder(listed, order) {
  if (!Array.isArray(listed)) return listed;        // AWS failure string, or null
  if (!Array.isArray(order) || order.length === 0) return listed;
  /* Entries validated, not trusted: 11ty runs a computed function against a proxy
     first to discover which keys it reads, so this sees placeholders before data. */
  const named = listed.filter((p) => p && typeof p.fileName === "string");
  const byName = new Map(named.map((p) => [p.fileName, p]));
  const out = [];
  for (const name of order) {
    const photo = byName.get(name);
    if (!photo) continue;                           // deleted from the bucket
    byName.delete(name);
    out.push(photo);
  }
  /* Unplaced photos keep bucket order and go last. */
  out.push(...byName.values());
  return out;
}
