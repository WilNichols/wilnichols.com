export default function () {
  return {
    eleventyComputed: {
      title: "{{ page.fileSlug }}",
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