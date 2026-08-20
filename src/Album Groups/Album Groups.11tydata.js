import { excerpt } from '../../lib/plain-text.js';
export default {
  permalink: false,
  eleventyComputed: {
    description: data => excerpt(data.page?.rawInput),
  }
}
