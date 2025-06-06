---
date: 2025-05-11T22:10
author: Wil Nichols
tags:
  - Case-Studies/Groups/Freelance
  - Case-Studies/Platforms/Desktop
  - Case-Studies/Tools/Photoshop
  - Topic/Nostalgia
  - Topic/Skeuomorphism
  - Topic/Work
summary: The Solitaire of Chess. My second iPhone app to ship with Opt-6 Products in 2009, Five Square later received an overhaul in 2011 with a brand-new, shining UI.
project:
  outcome: Universal iOS app shipping from 2009 through 2016.
  client: 'Opt-6 Products'
  skills:
  - Visual Design
  - UI Design
  tools:
  - Photoshop
  period: 
  - Summer 2011
  collaborators: 
  - '[Carter Allen](https://cartera.me)'
  - '[George Woodliff-Stanley](http://childrenastheorists.wordpress.com/)'
---

Opt-6 Products came to me with the idea for a unique card game, Five Square. A player starts with a 5x5 grid of cards, and wins by consolidating all cards into a single position. This is done by by moving a card within its column or row, onto another card of the same denomination or suit. The game appears simple until the player finds themselves with two irreconcilable stacks at the game’s end.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--five-square-2.njk' import FS2Board %}
{{ FS2Board() | mdRenderNJK | safe }}
{% endrenderTemplate %}

We had planned to update our 2011 release of Five Square with expanded gameplay settings and clearer How to Play instructions; however, Apple’s Game Center announcement in 2010 prompted us to reassess Five Square’s visual treatment. Additionally, in the time since our first release, the iPad had been announced and we wanted to ship a Universal app to take advantage of that opportunity.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--five-square-2.njk' import FS2Settings %}
{{ FS2Settings() | mdRenderNJK | safe }}
{% endrenderTemplate %}

I designed play screens (the card table), settings and performance screens, and a new icon that were in line with Apple’s new visual language, as well as iterating over gameplay directions, settings, and statistics to track user improvement game-over-game.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--five-square-2.njk' import FS2Icon %}
{{ FS2Icon() | mdRenderNJK | safe }}
{% endrenderTemplate %}

Five Square was removed from the App Store some time around 2020, and having been built against a no-longer-supported iOS SDK, it’s no longer available as a downloadable purchase. However, a demo of the game is available above, originally developed by Carter and George for the marketing website.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--five-square-2.njk' import FSVersions %}
{{ FSVersions() | mdRenderNJK | safe }}
{% endrenderTemplate %}

We had planned to [revisit](#future){.detail-link} Five Square with drag-and-drop, but that update wouldn’t be seen until its [2021 renewal](/five-square-3/).
