---

date: 2025-08-31T00:00
author: Wil Nichols
tags:
  - Case-Studies/Groups/Freelance
  - Case-Studies/Platforms/iOS
  - Case-Studies/Tools/Photoshop
  - Topic/Nostalgia
  - Topic/Skeuomorphism
  - Topic/Work
summary: Our first iteration of The Solitaire of Chess, and my second app to ship with Opt-6 Products.
project:
  outcome: An iPhone app shiping from 2009 through 2011, later succeeded by [Five Square 2](/five-square-2/){target=blank}
  client: 'Opt-6 Products'
  skills:
  - Visual Design
  tools:
  - Photoshop
  period: 
  - Summer 2009
  collaborators: 
  - '[Carter Allen](https://cartera.me){target=blank}'
  - '[George Woodliff-Stanley](http://childrenastheorists.wordpress.com/){target=blank}'
---

<!-- TODO: some kind of "notice" block -->
Note: Assets in this case study have been reproduced at 2x and 3x for modern screens, while attempting to preserve their original appearance. 

Quick on the heels of my first iOS app icon in [MathTasks](/TODO/), Opt-6 Products moved on to Five Square. Players start with a five by five grid of cards, and win by consolidating those cards into a single position. Cards are consolidated by value or suite, and the game is first made more difficult by adding suites, then a bonus card that must be placed as the final move, and finally by requiring all cards be consolidated at the centermost position. It's simple until a player finds themselves with a few irreconcilable stacks at the game's end.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--five-square-1.njk' import FS1Board %}
{{ FS1Board() | mdRenderNJK | safe }}
{% endrenderTemplate %}

I was fourteen and entering high school at the end of the summer, and wouldn't own an iPhone for another year. My family and I were on one of our yearly road-pilgrimages from Georgetown to Amarillo, and had stoped in Levelland[^1] to visit my mother's Aunt Faye. I remember sitting at the dining table in her wood-paneled, shag-carpeted, amber-lit home, using her neighbor's wi-fi to send card designs to Carter and George. She fortunately had a deck of cards that I used as references, seeing how to practically reduce detail to fit the cards' 39px x 54px surface.

After decades in that house, the carpet was more cigarette smoke and ash than it was carpet. Ten years before that, I'd made mud pies with one of her granddaughters in the house's front.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--five-square-1.njk' import FS1Selection %}
{{ FS1Selection() | mdRenderNJK | safe }}
{% endrenderTemplate %}

In addition to the card set, the game UI required (1) a selection state for cards, and (2) an emphasized state, highlighting the cards onto which the selected card could be moved. I remember being dissatisfied with them at the time, and but they're notable in that I remember trying to iterate my way to something acceptable.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--five-square-1.njk' import FS1Icons %}
{{ FS1Icons() | mdRenderNJK | safe }}
{% endrenderTemplate %}

Later moving onto the app icon, we went through three separate rounds with a number of iterations apiece before arriving at our chosen variation.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--five-square-1.njk' import FS1AppIcon %}
{{ FS1AppIcon() | mdRenderNJK | safe }}
{% endrenderTemplate %}

The three cards that gave deference to the redundant app name would later feature front-and-center in [Five Square 2's icon](/TODO/), and the five of hearts in [Five Square 3's](/TODO/).

Five Square 2 was later released in 2011, and Five Square 3 in 2020. Maybe we'll see Five Square 4 within the decade. 

{% renderTemplate "njk" %}
{%- from 'unique/case-study--five-square-2.njk' import FSVersions %}
{{ FSVersions() | mdRenderNJK | safe }}
{% endrenderTemplate %}


[^1]: "Flatter than a tabletop. Makes you wonder why they stopped here" [per James McMurtry](https://youtu.be/L-D824LHti4?si=ATKP3uXP-39fZXX7){target=blank}. "Where you'll watch your dog run away for hours" per my father.