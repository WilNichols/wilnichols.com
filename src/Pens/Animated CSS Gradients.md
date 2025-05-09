---
date: 2025-05-09T09:25
author: Wil Nichols
tags:
  - Topic/CSS
  - Topic/HTML
  - Type/Pen
preview: 
  type: vid
  class: themed-3x
  meta: /assets/vid/animated-css-gradients-poster--light@2x.png
  dir: animated-css-gradients
  assets:
    - media: '(prefers-color-scheme: dark) and (-webkit-min-device-pixel-ratio: 3) and (min-resolution: 180dpi)'
      poster: animated-css-gradients-poster--dark@3x.png
      source: animated-css-gradients--dark@3x.mp4
    - media: '(prefers-color-scheme: light) and (-webkit-min-device-pixel-ratio: 3) and (min-resolution: 180dpi)'
      poster: animated-css-gradients-poster--light@3x.png
      source: animated-css-gradients--light@3x.mp4
    - media: '(prefers-color-scheme: dark) and (-webkit-min-device-pixel-ratio: 2) and (min-resolution: 120dpi)'
      poster: animated-css-gradients-poster--dark@2x.png
      source: animated-css-gradients--dark@2x.mp4
    - media: '(prefers-color-scheme: light) and (-webkit-min-device-pixel-ratio: 2) and (min-resolution: 120dpi)'
      poster: animated-css-gradients-poster--light@2x.png
      source: animated-css-gradients--light@2x.mp4
    - media: '(prefers-color-scheme: dark) and (-webkit-min-device-pixel-ratio: 1) and (min-resolution: 60dpi)'
      poster: animated-css-gradients-poster--dark.png
      source: animated-css-gradients--dark.mp4
    - media: '(prefers-color-scheme: light) and (-webkit-min-device-pixel-ratio: 1) and (min-resolution: 60dpi)'
      poster: animated-css-gradients-poster--light.png
      source: animated-css-gradients--light.mp4
hero: /assets/embeds/animated-css-gradients/
renderTemplate:
  codeSnippets: 
    - type: 'code'
      title: 'CSS'
      lang: 'scss'
      src: '../static/css/pens/animated-css-gradients-01.scss'
    - type: 'code'
      title: 'CSS'
      lang: 'scss'
      src: '../static/css/pens/animated-css-gradients-02.scss'
    - type: 'code'
      title: 'CSS'
      lang: 'scss'
      src: '../static/css/pens/animated-css-gradients-03.scss'
    - type: 'code'
      title: 'CSS'
      lang: 'scss'
      src: '../static/css/pens/animated-css-gradients-04.scss'
    - type: 'code'
      title: 'SCSS'
      lang: 'scss'
      src: '../static/css/pens/animated-css-gradients-05.scss'
---
I recently designed a chatbot screen with limited real estate, where we needed to prioritize content but also show a thinking state without losing context. Prioritizing content meant avoiding unnecessary icons and controls, so I relied on a background image to show that the bot was composing a response.

The background was a branded “AI” pearlescent gradient, and when thinking, I wanted the gradient to loop over a pulsing animation. This pen demonstrates a simplified version of this method, where I create a gradient with negatively-positioned stops, and animate their position in the gradient.

To accomplish this, we define our typical gradient as stops between 0 and 100:

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {{ highlight(codeSnippets[0], standalone = true, title = 'CSS') }}
{% endrenderTemplate %}

We then repeat those stops offset by -100%. Notice that stops outside the 0-100 range do not render, effectively allowing us to create an animation timeline, with gradient stop as time.

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {{ highlight(codeSnippets[1], standalone = true, title = 'CSS') }}
{% endrenderTemplate %}

Let’s animate it. 

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {{ highlight(codeSnippets[2], standalone = true, title = 'CSS') }}
{% endrenderTemplate %}

Given that this gradient has different starting and ending values, it animates with a rough transition between loops. We can either revise the gradient to have the same color value at 0% and 100%, or we can animate the color at 0% to the color at 100%.

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {{ highlight(codeSnippets[3], standalone = true, title = 'CSS') }}
{% endrenderTemplate %}

Let’s put it all together. There’s a leap between these examples — this resembles much more the solution I used for myself than the step-by-step breakdown I’ve described, where I considered animating through a much more complex gradient.

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {{ highlight(codeSnippets[4], standalone = true, title = 'CSS') }}
{% endrenderTemplate %}