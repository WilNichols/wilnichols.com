/**
 * Reconciles the R2 inventory against the vault's editorial layer.
 *
 * R2 owns what exists; the sidecar owns which photos, in what order, and any
 * per-photo metadata. Neither is trusted to be complete, so this is tolerant
 * in both directions: a newly uploaded photo the sidecar has never heard of
 * still appears, and an entry naming a file that is no longer in the bucket is
 * dropped rather than rendering a broken image.
 */
export function applyAlbumOrder(listed, order, meta = {}) {
  if (!Array.isArray(listed)) return listed;      // AWS failure string, or null
  if (!Array.isArray(order) || order.length === 0) {
    return meta && Object.keys(meta).length ? listed.map(w(meta)) : listed;
  }

  const byName = new Map(listed.map((p) => [p.fileName, p]));
  const out = [];

  for (const name of order) {
    const photo = byName.get(name);
    if (!photo) continue;                          // deleted from the bucket
    byName.delete(name);
    out.push(photo);
  }
  // Anything the sidecar has not placed yet keeps the bucket's own order and
  // goes last, so a new upload is visible without being silently promoted.
  out.push(...byName.values());

  return out.map(w(meta));
}

const w = (meta) => (photo) => {
  const extra = meta?.[photo.fileName];
  return extra ? { ...photo, ...extra } : photo;
};

/** Files present in the bucket that the sidecar has not placed. */
export function unplaced(listed, order) {
  if (!Array.isArray(listed)) return [];
  const placed = new Set(Array.isArray(order) ? order : []);
  return listed.filter((p) => !placed.has(p.fileName)).map((p) => p.fileName);
}

/** Entries in the sidecar whose file is no longer in the bucket. */
export function orphaned(listed, order) {
  if (!Array.isArray(listed) || !Array.isArray(order)) return [];
  const have = new Set(listed.map((p) => p.fileName));
  return order.filter((name) => !have.has(name));
}
