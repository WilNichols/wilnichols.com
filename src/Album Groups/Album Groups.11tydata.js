export default function () {
  return {
    tags: "AlbumGroups",
    permalink: false
  }
}

/* eleventyComputed: { 
  date: function (data) {
    const collection = data.collections[data.tag];
    return (collection != '') ? collection.at(-1).date : '';
  }
}*/