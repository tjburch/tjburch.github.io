---
layout: post
title: "Evaluating Lance Lynn's Tremendous Start"
date: 2019-06-07
categories: Baseball
tags: [baseball]
---

If you scroll down the [pitching leaders](https://www.fangraphs.com/leaders.aspx?pos=all&stats=pit&lg=all&qual=y&type=8&season=2019&month=0&season1=2019&ind=0) page at Fangraphs today, most of the top pitchers by fWAR might not be so surprising, but tied for 6th overall at 2.3 WAR accrued is Lance Lynn. Lynn has posted a rather consistent career, being a 2-3 WAR guy who can eat innings, but hardly the type of character you would expect to break out, at age 32.

If you look longer at Lynn's row on the pitching leaderboard, something else might catch your eye - he's managed this while having a 4.50 ERA. This is symptomatic of fWAR being calculated using FIP, which is considerably better at 3.19, meaning the Rangers defense is costing him over a run per 9 innings. This is illuminated in his BABIP, suffering from a career worst at .344, where league average this year is .292. In fact, his FIP is a full point lower than his own career average, indicating that there has been some significant, true improvement this year. To evaluate this season vs prior production, I took a look at Lynn's IP per WAR:

<img src="/blogimages/lynn2019/ip_per_war.png" alt="" class="center" border="5" style="width:800px;"/>

Already this plot is a bit surprising, the expectation for such a distribution would be to follow a typical aging curve, but, excluding the outlier, Lynn seems to be continuing to improve. If you do drop off the outlier, remove his missed year for Tommy John surgery, and look at the points prior to this year, a linear regression does quite well in describing his improvement year-to-year:

<img src="/blogimages/lynn2019/lynn_ip_per_war_regression.png" alt="" class="center" border="5" style="width:800px;"/>

But this breaks down entirely in 2019. Following the linear trend, you might expect him to be worth a win every 50 IP. If you were realistic and evaluated this against an aging curve, you might expect worse than that. Instead, he's been worth a win every 32 innings pitched, something nobody would have expected walking into this season. 

Lynn started a 3-year, $30M contract with the Rangers this year, so it's possible you can contribute some of this to pitching against different opponents, but for a change this significant, I went on to look into if there were any major smoking guns to indicate a change in approach.

If you know anything about Lance Lynn, you know that he likes fastballs. I mean, he really likes fastballs. On June 2, 2015, Lynn threw 118 pitches in a 1-0 win over the Brewers. Of those, 117 were fastballs. On being asked what the other was, he replied "It was an out, who cares?" Following this start, in one of [my favorite postgame interviews of all time](https://www.youtube.com/watch?v=m5dvlF002mw), while joking with the media, he foreshadows talking about secondary pitches "...it's part of evolving as a pitcher, you never know when you get older and might need some other pitches, so why not work on them now?"

In fact, that's the most notable change in his approach this year. Lynn's 4 and 2-seam fastball usage (FB%) is significantly down from prior years, to 69.8%, 7.4% lower than his career average. Taking a look at his total pitch composition:

<img src="/blogimages/lynn2019/lynn_stack.png" alt="" class="center" border="5" style="width:800px;"/>

<img src="/blogimages/lynn2019/lynn_line.png" alt="" class="center" border="5" style="width:800px;"/>

While his fastball usage has decreased in aggregate, it's really that he's scaled back his 2-seam usage significantly. He's actually increased his 4-seam usage, and is getting more and more comfortable with his cutter, increasing usage by 5.8% over last year. This change in approach seems to have really helped his results. 

It seems that not only does Lance love fastballs, but he's now focusing on the fastballs that return the love the most.