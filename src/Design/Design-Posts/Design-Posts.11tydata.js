/* Work entries. The markdown lives in the vault (Work/Design/); only this config
   stays here. `permalink: false` on purpose: an entry has no page of its own, it is
   one shot in a carousel, grouped by its first `Design/<Name>` tag. */
export default function () {
  return {
    permalink: false,
    tags: "Design"
  }
}
