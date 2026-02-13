---
date: 2025-04-08T01:30
author: Wil Nichols
tags:
  - Case-Studies/Groups/Freelance
  - Case-Studies/Platforms/Desktop
  - Case-Studies/Tools/Photoshop
  - Topic/Nostalgia
  - Topic/Skeuomorphism
  - Topic/Work
summary: Way back when everyone and their dog were designing GTD apps, a friend and I explored our own functionally minimally and visually rich task list.
project:
  outcome: High fidelity UI comps
  client: Zach Fisher and myself
  skills:
  - Visual Design
  - UI Design
  tools:
  - Photoshop
  period: 
  - Summer 2011 
  - Spring 2013
  collaborators: 
  - '[Zach Fisher](https://zachfisher.com)'
---

In mid 2011,[^1] GTD apps were a booming space for indie developers. Between [Things](https://web.archive.org/web/20110323094949/http://culturedcode.com/things/){target=blank}, [The Hit List](https://www.macstories.net/news/potion-factorys-the-hit-list-1-0-now-available/){target=blank}, [Wunderlist](https://www.macstories.net/reviews/wunderlist-review-untethered-task-management-freedom/){target=blank} and infinite others, we saw a small opportunity for a low-real-estate to-do list with projects, sections, and individual tasks.[^2]

{% renderTemplate "njk" %}
{%- from 'unique/case-study--diligence.njk' import DiligenceAnnotatedWindow with context %}
{{ DiligenceAnnotatedWindow() | mdRenderNJK | safe }}
{% endrenderTemplate %}

Zach and I began by appraising our ideal GTD solution. We wanted novelty, but without monopolizing the user’s focus. At a time when desktop and mobile UIs were increasingly visually rich and illustrative, we took plenty of liberty in visual design. But, its core was a simple task list. It didn’t need to occupy the user’s screen and demand larger-scale management. It didn’t need to scale from simple list items to complex multidimensional and interdependent tasks. 

{% renderTemplate "njk" %}
{%- from 'unique/case-study--diligence.njk' import DiligenceDetailWindow %}
{{ DiligenceDetailWindow() | mdRenderNJK | safe }}
{% endrenderTemplate %}

It needed a main view with tasks, groups of tasks, and mutually-exclusive groups of groups. Furthermore, we planned a detail view allowing for a task description, start and end dates, attached files, and further information.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--diligence.njk' import DiligenceAppIcon %}
{{ DiligenceAppIcon() | mdRenderNJK | safe }}
{% endrenderTemplate %}

I designed an app icon and interface icons for the Preferences window.

{% renderTemplate "njk" %}
{%- from 'unique/case-study--diligence.njk' import DiligencePreferenceIcons %}
{{ DiligencePreferenceIcons() | mdRenderNJK | safe }}
{% endrenderTemplate %}

As a self-taught newcomer to product design and development, I often worked backwards from the product that I wished existed, designing what I desired others build.  Like a lot of ideas then — it was fun, and left incomplete. 

[^1]: The iteration pictured was updated for OS X Mountain Lion in 2013, but was originally designed for OS X Lion in 2011.
[^2]: Fortunately we only trend-jumped _after_ everyone had built Twitter clients. Thanks, Elon.
