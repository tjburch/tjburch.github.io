---
layout: post
title: "Astros 2017 K% Change"
date: 2019-11-14
categories: Baseball
tags: [baseball]
---

This week, major news broke about the Astros stealing signs at home in 2017, and relaying this information to their players via hitting a trash can in their dugout. There's been a lot of mixed reporting on how much this actually affected their play. Some have argued there wasn't significant impact, citing that they performed comparably, or even better, on the road. Others, such as [this study](https://www.reddit.com/r/baseball/comments/dw9wnd/the_astros_home_k_dropped_from_244_in_2016_to_166/) by a Reddit user claim that it dramatically helped them, referencing their year-to-year K%.

<img src="https://i.redd.it/k2upnaryqny31.png" class="center" border="5" style="width:70%;">

The oversight in this study is that the personnel changed dramatically between 2016 and 2017, getting rid of players like Castro, Rasmus, Valbuena, and Gomez, while acquiring players like Beltran and Reddick. This is something that I wanted to investigate further, trying to remove the influence of the changing players.

I decided to take a look into _just_ the players that had PAs in both 2016 and 2017, giving continuity over the years, and providing samples in both a time before and after the trash can sign stealing began. Ultimately this list came to the following players:

- Jose Altuve
- Alex Bregman
- Carlos Correa
- Evan Gattis
- Marwin Gonzalez
- Yuli Gurriel
- Tony Kemp
- Jake Marisnick
- Colin Moran
- AJ Reed
- George Springer
- Max Stassi
- Tyler White

For these players, their K% does still drop significantly, from 22.2 to 16.5%. Ultimately this is a 5.7 K% drop year-over-year, and evaluating against the plot above, it's a **25.7% change**. Comparing to the presented plot, this would certainly be an extreme value, but not out of the realm of possibility. The author cites that the Rangers change from 2009 to 2010 was 25.6%, nearly identical. 

The full work can be found in [this jupyter notebook](https://github.com/tjburch/baseball-studies/blob/master/notebooks/astros_krate_continuity.ipynb).

One factor that isn't accounted for in this quick check the fact that players do get better, especially when the team is rather young. Bregman, for example, had his rookie season in 2016 with 217 PAs. In his sophomore season, he dropped his K% from 24.0% to 15.5%, and likely some portion of that is just from additional MLB experience.