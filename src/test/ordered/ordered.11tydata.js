/* Directory data for the ordered-album fixture, mirroring how the real Albums
   directory computes `photos`: the listing stands in for the bucket, and the
   sidecar beside the template supplies the order. Scoped to this directory so it
   cannot clobber the `photos` other fixtures set in frontmatter. */
import { applyAlbumOrder } from "../../Albums/Albums/Albums.11tydata.js";

export default {
  eleventyComputed: {
    photos: (data) => applyAlbumOrder(data.listing, data.photoOrder),
  },
};
