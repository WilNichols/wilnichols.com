---
date: 2025-02-10T02:30
author: Wil Nichols
altTitle: "Liège Waffles"
tags:
  - Topic/Cooking
permalink: /recipes/liege-waffles/
summary: I took part of Belgium with me.
ingredientsContainer:
  ingredients: 
  - name: "Instant yeast"
    imperial: "3/4 tsp"
    metric: "2.3g"
  - name: "Warm water"
    imperial: "1/4 c"
    metric: "50g"
  - name: "All-purpose flour"
    imperial: "1 1/2 c"
    metric: "200g"
  - name: "Eggs, room temp"
    imperial: "2x"
    metric: "100g"
  - name: "Light brown sugar"
    imperial: "2 tbsp"
    metric: "28g"
  - name: "Salt"
    imperial: "3/4 tsp"
    metric: "3.8g"
  - name: "Vanilla extract"
    imperial: "2 tsp"
    metric: "10 ml"
  - name: "Orange blossom honey"
    imperial: "2 tsp"
    metric: "14g"
  - name: "Butter, near room temp"
    imperial: "11 tbsp"
    metric: "150g"
  - name: "Pearl sugar"
    imperial: "3/4 c"
    metric: "135g"
---
{% renderTemplate "njk", data %}
  {% from "../_includes/picture.njk" import Picture with context %}
  {% set src = "https://cdn.wilnichols.com/recipes/liege-waffles/DSCF5623.jpg" %}
  {% set imageProps = src | imageInfo %}
  {{  Picture(
      fileName = 'dscf5623-jpg',
      src = src,
      loading = 'eager',
      imageProps = imageProps,
      isWNCDN = true
  ) }}
{% endrenderTemplate %}

I made those! Actually, 53. This recipe fortunately yields a practical six instead.

Since first enjoying Liège waffles on my [first visit](/albums/leuven-1/) to Leuven in 2017, I’ve wanted to find a version I could recreate at home. It wasn’t until moving to Pittsburgh five years later that I finally took the time to do so.[^1]

Googling, I found a couple dozen recipes that all looked picturesque, but I had no way of judging their quality, and I was put off by photos of these waffles wearing fresh fruit and dustings of powdered sugar.[^2] Fortunately I’d met a a retired Belgian expat in town who’d opened [Treat](https://www.treatpittsburgh.com), serving the closest waffles I’d found in the States. He told me to specifically keep an eye out for (1) recipes without milk—you can’t get the same texture— and (2), an overnight rise. 

I eventually found Adam Wayda’s [recipe](https://liegewaffle.wordpress.com/liege-waffle-recipe-liege-gaufre-recette/), his [advanced recipe](https://web.archive.org/web/20160325024251/http://www.waffle-recipes.com/liege-waffle-recipe-gaufres-de-liege/), and his [experiments](https://web.archive.org/web/20160322013947/http://www.waffle-recipes.com/) in which he regularly [milled his own flour](https://web.archive.org/web/20160314235719/http://www.waffle-recipes.com/2016/01/22/milling-my-own-flour/). This goes too hard for me, but one’s got to respect the hustle.

The following recipe contains only slight modifications to his, based significantly more on convenience than improvement. This is modified now for my current Texan kitchen, which often runs warmer and more humid than other parts of the country, so some times are modified. I’m reprinting it here in admiration and to preserve it as online platforms progressively deteriorate.

{% renderTemplate "njk", ingredientsContainer %}
  {% from "../_includes/ingredients.njk" import ingredientsList with context %}
  {{ ingredientsList(ingredients) }}
{% endrenderTemplate %}

## Directions {.heading--6}
1. In your stand mixer, dissolve yeast in warm[^3] water, allowing it to rest for a few minutes. Add a third of your flour and half of your eggs. Mix until consistent.
2. Cover the mixture with the remainder of your flour, without stirring. Let it stand for one hour, covered airtight with plastic wrap. You’ll return to the wet batter bubbling up through the flour.
3. Add the remaining half of your eggs, light brown sugar, vanilla extract, and honey.
4. With your mixer’s paddle attachment, mix on the lowest speed. Scrape down the bowl regularly to ensure no unmixed flour. After 15-20 minutes the dough should form into a ball around the paddle.
5. Add the butter in tablespoon increments over the course of 10 minutes. You should see them fully incorporate, and not rush.
6. Continue scraping, waiting for the dough to ball again. This should take under 5 minutes.
7. Scrape the dough into a large bowl covered airtight with plastic wrap, and allow it to rise at room temperature for four hours.[^4] 
8. Punch down to relieve some (but not all) air from the dough. Then, allow it to rest in your refrigerator overnight. 
9. The next day, take the dough from the fridge. Portion each into six balls weighing 114g apiece. If not cooking immediately, wrap these tightly in plastic wrap and freeze. When cooking from the freezer, make sure to move them from to the refrigerator the night before to gently defrost.[^5]
10. Then add 1/6 of your pearl sugar to each ball, both on the surface and within the dough. 
11. Shape each into an oval, allowing a 90 minute rise loosely under a warm, damp cloth.
12. Cook in your waffle iron to the desired doneness.

[^1]: Working from home full-time did a number on me. The early pandemic doesn’t count, because that also did a number on me. 
[^2]: This isn’t a brunch food so much as it is a heart-stopping desert in the shape of a casual afternoon snack. Belgians unlike us Americans get plenty of cardio by biking everywhere.
[^3]: 104-110 °F of 50g @ 41-43 °C
[^4]: Be generous in sizing your dough vessel. I’ve had them overflow with this recipe.
[^5]: You can add the pearl sugar before freezing, to the detriment of quality. It affects the freeze, draws moisture from the dough, and I’m pretty sure impacts the final product.