---
date: 2024-06-15T11:58
author: Wil Nichols
tags:
  - Topic/CSS
  - Topic/HTML
  - Topic/no-JS
  - Topic/Prototype
  - Type/Pen
preview: 
  type: vid
  class: themed-3x
  meta: /assets/vid/segmented-control-pen-poster--light@2x.png
  dir: segmented-control
  assets:
    - media: '(prefers-color-scheme: dark) and (-webkit-min-device-pixel-ratio: 3) and (min-resolution: 180dpi)'
      poster: segmented-control-pen-poster--dark@3x.png
      source: segmented-control-pen--dark@3x.mp4
    - media: '(prefers-color-scheme: light) and (-webkit-min-device-pixel-ratio: 3) and (min-resolution: 180dpi)'
      poster: segmented-control-pen-poster--light@3x.png
      source: segmented-control-pen--light@3x.mp4
    - media: '(prefers-color-scheme: dark) and (-webkit-min-device-pixel-ratio: 2) and (min-resolution: 120dpi)'
      poster: segmented-control-pen-poster--dark@2x.png
      source: segmented-control-pen--dark@2x.mp4
    - media: '(prefers-color-scheme: light) and (-webkit-min-device-pixel-ratio: 2) and (min-resolution: 120dpi)'
      poster: segmented-control-pen-poster--light@2x.png
      source: segmented-control-pen--light@2x.mp4
    - media: '(prefers-color-scheme: dark) and (-webkit-min-device-pixel-ratio: 1) and (min-resolution: 60dpi)'
      poster: segmented-control-pen-poster--dark.png
      source: segmented-control-pen--dark.mp4
    - media: '(prefers-color-scheme: light) and (-webkit-min-device-pixel-ratio: 1) and (min-resolution: 60dpi)'
      poster: segmented-control-pen-poster--light.png
      source: segmented-control-pen--light.mp4
hero: /assets/embeds/segmented-control/
url: 
renderTemplate:
  codeTabs: 
    - type: 'code'
      title: 'HTML'
      lang: 'html'
      src: '../static/embeds/segmented-control/index.html'
    - type: 'code'
      title: 'SCSS'
      lang: 'scss'
      src: '../static/css/pens/segmented-control.scss'
---
Try the demo. 👆🏻

Should UI be written this way? No, but it’s amusing. More seriously, we tend to put our cruft on the JS end of functionality when a surprising amount can be done with HTML and CSS alone. 

Working on components and systems with my team, I often find that designers lacking development experience have a rough time understanding both a component’s design and programmatic inputs and outputs. Working on this with junior designers, we do an exercise where we compare basic UI elements and see if we can logically recreate one with the functionality of another. For example, radio inputs within a fieldset represent a single selection within an array, which map to a whole host of other elements—and silly dev exercises like this help to make that point. 

View the source below.

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/tabs.njk' import tabs with context -%}
  {{- tabs(codeTabs) -}}
{% endrenderTemplate %}
