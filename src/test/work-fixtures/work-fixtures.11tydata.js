/* Fixture work entries. They join collections.Design so the carousel can group
   them by their own `Design/<Name>` tag, which is the one thing a page-scoped
   fixture cannot fake: shots.njk looks a project up in collections rather than
   taking it as an argument.

   Because they are in that collection, the home page has to reject them, which it
   does with the `notFixtures` filter. `fixture: true` is what that filter reads. */
export default function () {
  return {
    permalink: false,
    draft: true,
    /* The parent test data excludes fixtures from collections, which is right for
       every other type but fatal here: a work entry is only reachable through the
       collection its project tag names. Draft still keeps it off production. */
    eleventyExcludeFromCollections: false,
    fixture: true,
    tags: "Design",
    author: "Fixture",
  }
}
