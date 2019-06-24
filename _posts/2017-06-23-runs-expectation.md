---
layout: post
title: "Run Expectation from Hits"
date: 2019-06-23
categories: Baseball
tags: [baseball]
---

Recently with the Cardinal's struggles in offensive production, I've been thinking a bit about run expectancy based on the number of hits in a game. Obviously these are going to be correlated, but I was curious, how strongly, and how well you could predict runs given number of hits.

I went and looked at 2018 data for runs scored based on number of hits and did a linear regression:

<img src="/blogimages/runs_v_hits/runs_v_hits_linregression.png" class="center" border="5" style="width:60%;">

As expected, the Pearson Correlation is 0.779, which falls under "strongly correlated." In an attempt to try to get to some prediction method, I calculated the mean at every hit value, and plotted those values, then tried to fit that data. 

<img src="/blogimages/runs_v_hits/runs_v_hits.png" class="center" border="5" style="width:60%;">

Looking at just the means, a linear fit does not match the data well, so a polynomial fit of order 2 was used, which does. The coefficient on the x<sup>2</sup> term appears small, but once you get to 6 hits, it raises the expectation by an additional run. Once you add standard deviation uncertainty lines to this plot though, you could see that within the 68% confidence interval of 1 sigma, a linear fit could probably work just as well to this data.