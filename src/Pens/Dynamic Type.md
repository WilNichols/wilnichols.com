---
date: 2024-08-13T12:09
originalDat: 2019-04-24T10:43
author: Wil Nichols
tags:
  - Topic/CSS
  - Topic/HTML
  - Type/Pen
  - Topic/Accessibility
preview: 
  type: svg
  class: themed-3x
  meta: /assets/img/dynamic-type@2x.png
  dir: dynamic-type
  assets: ../static/embeds/dynamic-type/index.html
assets: 
  demo: /assets/embeds/dynamic-type/
  html: ../static/embeds/dynamic-type/index.html
  scss: ../static/css/dynamic-type.scss
url: 
---
This must be viewed in Safari on macOS or iOS to make much sense—they allow one to use iOS and macOS system fonts directly on web. More importantly, they allow one to take advantage of [Dynamic Type](https://developer.apple.com/design/human-interface-guidelines/typography). Of course, use a fallback for non-Apple clients.

I was digging through old prototypes and found this snippet from April 2019. Pretty sure I threw this together when visiting The Minte in Chicago, when they were shipping an updated web app with higher usage than their mobile apps, and I wanted to see which accessibility features we could trivially use. 

This 2015 [post](https://webkit.org/blog/3709/using-the-system-font-in-web-content/) from the Webkit blog is the only public-facing documentation I can find for these `font` shorthands. When reassessing this weekend, I spelunked through Github to find [this](https://github.com/stylelint/stylelint/blob/ee3118d2460cddf469f959b5438d8aeab7e9584e/lib/reference/keywords.mjs#L29) blurb from Stylelint, adding values `title0` through `title4`. I verified with Webkit’s autocomplete [values](https://github.com/WebKit/WebKit/blob/7828ff0e5c37f0f9824cf3fd8633e16f34545d76/Source/WebInspectorUI/UserInterface/Models/CSSKeywordCompletions.js#L629). When I’d first found it, there was no style for iOS’s `largeTitle` font style. Today’s additions still lack a correspondingly named `largeTitle`, but they’re better than my old approach of scaling `headline` by 2x.

Related—`title0` is a regular-weight version of `largeTitle`, and I’m unsure which system font style `title4` matches. That said, you can adjust `title0`’s font-weight and get `largeTitle` in no time.

One can also override `font-face`, but naturally neither `font-size` nor `line-height`. If that’s desirable, use a `scale` transform and wrap the text in a containing element to control block-size. You can’t modify line-height this way, but there should be layout trickery around this. 
