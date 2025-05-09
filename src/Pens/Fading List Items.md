---
date: 2025-05-08T23:45
author: Wil Nichols
tags:
  - Topic/CSS
  - Topic/HTML
  - Type/Pen
preview: 
    type: svg
    assets: 
      - ../static/embeds/fading-list/preview.svg
hero: /assets/embeds/fading-list/
renderTemplate:
  codeTabs: 
    - type: 'code'
      title: 'SCSS'
      lang: 'scss'
      src: '../static/css/pens/fading-list.scss'
    - type: 'code'
      title: 'HTML'
      lang: 'html'
      src: '../static/embeds/fading-list/index.html'
altTitle: "Styling Items by List-Length"

---
I quickly wrote this snippet last week to demonstrate to a colleague that we could progressively modify elements’ style by passing [list item number](https://legacy.reactjs.org/docs/lists-and-keys.html) and list length via inlined custom css properties. 

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {% for code in codeTabs -%}
      {{ highlight(code, standalone = true, title = code.title) }}
  {% endfor %}
{% endrenderTemplate %}
