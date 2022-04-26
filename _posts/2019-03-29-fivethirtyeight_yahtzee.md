---
layout: posts
title: "Fivethirtyeight Riddler: Can You Turn America’s Pastime Into A Game Of Yahtzee?"
date: 2019-03-29
categories: Misc
tags: [fivethiryeight, puzzles, riddler]
excerpt: "If baseball isn't random enough, let's make it into a dice game"
---

This weekend I decided to take on the weekly Riddler question, from fivethirtyeight. The original problem text can be found [here](https://fivethirtyeight.com/features/can-you-turn-americas-pastime-into-a-game-of-yahtzee/). My solution, in full can be found on [my github profile](https://github.com/tjburch/puzzles/tree/master/puzzler538_2019_Mar22). My solution was one of the two featured ones, [highlighted](https://fivethirtyeight.com/features/can-you-win-a-spelling-bee-if-you-know-99-percent-of-the-words/) at the bottom of the next week's edition.

The problem statement

> Over the years, people have invented many games that simulate baseball using two standard dice. In these games, each dice roll corresponds with a baseball event. Two players take turns rolling dice and tracking what happens on the field. Suppose you happen to be an ardent devotee of one of these simulated games from the late 19th century, called Our National Ball Game, which assigns rolls to baseball outcomes like so:

>1, 1: double  
>1, 2: single  
>1, 3: single  
>1, 4: single  
>1, 5: base on error  
>1, 6: base on balls  
>2, 2: strike  
>2, 3: strike  
>2, 4: strike  
>2, 5: strike  
>2, 6: foul out  
>3, 3: out at 1st  
>3, 4: out at 1st  
>3, 5: out at 1st  
>3, 6: out at 1st  
>4, 4: fly out  
>4, 5: fly out  
>4, 6: fly out  
>5, 5: double play  
>5, 6: triple  
>6, 6: home run  

>Given those rules, what’s the average number of runs that would be scored in nine innings of this dice game? What’s the distribution of the number of runs scored? (Histograms welcome.) You can assume some standard baseball things, like runners scoring from second on singles and runners scoring from third on fly outs.

In summary, what I did was run a random number generator to simulate the dice rolling, then generated code to simulate base/out state progress given each event. Then I simulated 100,000 games and plotted the outcomes.

![center](https://github.com/tjburch/puzzles/raw/master/puzzler538_2019_Mar22/plots/raw_scoring_histogram.png)

I also attempted to fit this distribution...

![center](https://github.com/tjburch/puzzles/raw/master/puzzler538_2019_Mar22/plots/scoring_histogram_skewGaus.png)


I then tried the Riddler Classic problem: 

> Figuring the statistical outcomes of the 130-year-old game described in Riddler Express may be a bit outdated, so you decide that you can do better. You get to work making your own list of dice rolls, tweaking what corresponds to each roll to better match the real distributions of baseball run scores. You should be using that same set of standard baseball assumptions about when runners score (sacrifice flies, runners scoring from second, etc.).

> Once you’ve matched the run-scoring environment, try to add other variables to your computations. What if you try to simulate strikeouts per game, batting average, etc.?

> In other words, how closely can you simulate the grand, yet subtle, complexities of the national pastime using only a pair of cubes? What does your roll list look like?

Extending the philosophy from the express portion, the figure of merit for my solution is intended to be the mean and distribution of runs scored in a real MLB game. A solution was obtained by taking MLB data from 2018 using Statcast. First, to get close to the answer, assuming the simulation is written fine, mirroring the rates of the real life outcomes to the dice roll outcomes should get close to the solution. I found the rates of various events in real baseball and how frequently they occurred with respect to each other. Using this method, I was able to fill out all but 5 of the dice rolls. Since this should be ~close to the real mean I just tried to cancel out those by putting 3 good, 1 base events (singles, base on balls), and 2 bad events (outs). From there I ran the simulation, plotted the histogram, then tuned the last couple of outcomes to get the mean as close as possible. The final result:

(1, 1): triple  
(2, 2): base on error  
(3, 3): double play  
(4, 4): home run  
(5, 5): double  
(6, 6): strike out  
(1, 2): strike out  
(1, 3): strike out  
(1, 4): base on balls  
(1, 5): single  
(1, 6): single  
(2, 3): fly out  
(2, 4): fly out  
(2, 5): fly out  
(2, 6): fly out  
(3, 4): fly out  
(3, 5): fly out  
(3, 6): strike out  
(4, 5): single  
(4, 6): base on balls  
(5, 6): single  

![center](https://github.com/tjburch/puzzles/raw/master/puzzler538_2019_Mar22/plots/mlb_simulation_overlay.png)

