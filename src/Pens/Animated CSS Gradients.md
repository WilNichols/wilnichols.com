---
date: 2025-05-08T13:03
author: Wil Nichols
tags:
  - Topic/CSS
  - Topic/HTML
  - Type/Pen
preview: 
    type: svg
    assets: 
      - ../static/embeds/fading-list/preview.svg
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

---
I recently designed a chatbot screen with limited real estate, where we needed to prioritize content but also show a thinking state without losing context. Prioritizing content meant avoiding unnecessary icons and controls, so I relied on a background image to show that the bot was composing a response.

The background was a branded "AI" pearlescent gradient, and when thinking, I wanted the gradient to loop over a pulsing animation. This pen demonstrates a simplified version of this method, where I create a gradient with negatively-positioned stops, and animate their position in the gradient.

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

Let's animate it. 

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {{ highlight(codeSnippets[2], standalone = true, title = 'CSS') }}
{% endrenderTemplate %}

Given that this gradient has different starting and ending values, it animates with a rough transition between loops. We can either revise the gradient to have the same color value at 0% and 100%, or we can animate the color at 0% to the color at 100%.

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {{ highlight(codeSnippets[2], standalone = true, title = 'CSS') }}
{% endrenderTemplate %}

Let's put it all together: 

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {{ highlight(codeSnippets[2], standalone = true, title = 'CSS') }}
{% endrenderTemplate %}

Lastly, I've abstracted this to SCSS.

{% renderTemplate "njk", renderTemplate %}
  {%- from '../_includes/highlight.njk' import highlight with context -%}
  {{ highlight(codeSnippets[2], standalone = true, title = 'CSS') }}
{% endrenderTemplate %}