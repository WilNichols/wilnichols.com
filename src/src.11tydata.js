import { DateTime } from "luxon";

function utc(date) {
  return date instanceof Date
    ? DateTime.fromJSDate(date, { zone: "utc" })
    : DateTime.fromISO(String(date), { zone: "utc" });
}

function postDate(data) {
  const original = data.originalDate && utc(data.originalDate);
  if (original && original.isValid) return original;
  return utc(data.page.date);
}

export default function () {
  return {
    // Constant across everything published here, so it lives with the build
    // rather than being restated in every note's frontmatter.
    author: "Wil Nichols",
    eleventyComputed: {
      title: function (data) {
        // Frontmatter wins; the filename is only the fallback. Previously this
        // returned fileSlug unconditionally, so an authored title never rendered.
        // `||`, not `??`: 11ty supplies an empty string rather than
        // undefined when a note has no frontmatter title.
        return data.title || data.page.fileSlug;
      },
      displayDate: function (data) {
        return postDate(data).toISO();
      },
      sortDate: function (data) {
        return postDate(data).toJSDate();
      },
      month: function (data) {
        const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        return month[(new Date(data.date || data.page.date).getMonth())];
      },
      year: function (data) {
        return new Date(data.date || data.page.date).getFullYear();
      }
    }
  }
}
