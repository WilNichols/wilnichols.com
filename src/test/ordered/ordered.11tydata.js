/* Mirrors how the real Albums directory computes `photos`: `listing` stands in for
   the bucket, the sidecar beside the template supplies the order. Scoped to this
   directory so it cannot clobber the `photos` other fixtures set in frontmatter. */
import { applyAlbumOrder } from "../../../lib/album-order.js";

export default {
  eleventyComputed: {
    photos: (data) => applyAlbumOrder(data.listing, data.photoOrder),
  },
};
