/* Index-card previews for pens.

   This was 23 lines of frontmatter per pen, and every line of it was build
   configuration: six `(prefers-color-scheme: …) and (-webkit-min-device-pixel-
   ratio: …)` variants, which are a fixed 3-density by 2-scheme matrix, plus
   filenames that follow from the asset directory. None of it is a decision
   anyone revisits while writing a pen, and the vault's own dividing line puts
   it here — changing it changes how something is built, not what a reader
   understands.

   What stays authored is the one thing a table cannot derive: which pen has a
   video and which has an SVG, and the embed directory for the two whose folder
   name does not match their title. */

const DENSITIES = [
  { suffix: "@3x", ratio: 3, dpi: 180 },
  { suffix: "@2x", ratio: 2, dpi: 120 },
  { suffix: "",    ratio: 1, dpi: 60 },
];
const SCHEMES = ["dark", "light"];

/* `dir` is the folder on the CDN; `stem` is what the files inside it are named.
   They are usually the same, and for Segmented Control they are not — the files
   carry a `-pen` suffix the folder does not. */
function videoAssets(dir, stem = dir) {
  return DENSITIES.flatMap(({ suffix, ratio, dpi }) =>
    SCHEMES.map((scheme) => ({
      media: `(prefers-color-scheme: ${scheme}) and (-webkit-min-device-pixel-ratio: ${ratio}) and (min-resolution: ${dpi}dpi)`,
      poster: `${stem}-poster--${scheme}${suffix}.png`,
      source: `${stem}--${scheme}${suffix}.mp4`,
    })));
}

/* Keyed by the note's filename, which is what `page.fileSlug` carries. */
const PENS = {
  "Animated CSS Gradients": { type: "vid", dir: "animated-css-gradients" },
  "Segmented Control":      { type: "vid", dir: "segmented-control", stem: "segmented-control-pen" },
  "CSS + Dynamic Type":     { type: "svg", embed: "dynamic-type" },
  "Fading List Items":      { type: "svg", embed: "fading-list" },
};

export function penPreview(fileSlug) {
  const pen = PENS[fileSlug];
  if (!pen) return undefined;
  if (pen.type === "svg") {
    return { type: "svg", assets: [`../static/embeds/${pen.embed}/preview.svg`] };
  }
  return {
    type: "vid",
    class: "themed-3x",
    /* The RSS thumbnail: one still, at the density most readers are on. */
    meta: `/assets/vid/${pen.stem ?? pen.dir}-poster--light@2x.png`,
    dir: pen.dir,
    assets: videoAssets(pen.dir, pen.stem),
  };
}
