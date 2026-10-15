import { penPreview } from "../../../lib/pen-previews.js";

export default function () {
  return {
    permalink: "/{{ page.fileSlug | slugify }}/index.html",
    tags: "Pens",
    layout: 'post.njk',
    postType: 'pen',
    postCollection: 'Pens',
    eleventyComputed: {
      /* The vault no longer authors `preview:`; it is derived in lib/pen-previews.js.
         A note that still carries one keeps it. */
      preview: data => data.preview || penPreview(data.page.fileSlug),
    }
  }
}
