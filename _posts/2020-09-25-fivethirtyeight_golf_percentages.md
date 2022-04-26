---
layout: posts
title: "Fivethirtyeight Riddler: Golf Percentages"
date: 2020-09-25
categories: Misc
tags: [fivethiryeight, puzzles, riddler]
excerpt: "An analytical solution plus some plots in R (yes, you read that right, R)"
---

<script src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML" type="text/javascript"></script>


This week's [Riddler Express](https://fivethirtyeight.com/features/can-you-save-some-cold-pizza/) was one I managed to solve analytically, but I've also included some plots in R for some post-problem analysis, just for fun.


# Riddler Express

>From Dan Levin comes a hazardous riddle for the ironclad and eagle-eyed:

>The U.S. Open concluded last weekend, with physics major Bryson DeChambeau emerging victorious. Seeing his favorite golfer win his first major got Dan thinking about the precision needed to be a professional at the sport.

>A typical hole is about 400 yards long, while the cup measures a mere 4.25 inches in diameter. Suppose that, with every swing, you hit the ball X percent closer to the center of the hole. For example, if X were 75 percent, then with every swing the ball would be four times closer to the hole than it was previously.

>For a 400-yard hole, assuming there are no hazards (water, sand or otherwise) in the way, what is the minimum value of X so that you’ll shoot par, meaning you’ll hit the ball into the cup in exactly four strokes?

## Solution

Let the initial distance from the tee to the hole be $$d_0$$. The percent of the total distance covered by each shot is given by $$x$$. Then, the remaining distance to the hole after the first hit is given by

\begin{equation}
    d_1 = d_0 (1-x)
\end{equation}

Similarly, the distance after the second hit is given by

\begin{equation}
  d_2 = d_1(1-x)\\
  d_2 = (d_0(1-x))(1-x) = d_0(1-x)^2
\end{equation}

It follows that after $N$ strokes, the remaining distance is given by

\begin{equation}
  d_N = d_0(1-x)^N
\end{equation}

To estimate when the hit would land in the hole, we want $$d_N=r$$, the hole's radius. At this point, the center of the ball will lie on the edge of the hole and we can assume gravity will do the trick. If we want that to achieve a par of 4, then this must occur when $$N=4$$. The problem gives a course length of $$d_0=14,400$$ (400 yards in inches), and $$r=4.25/2=2.125$$.

\begin{equation}
  d_4 = d_0(1-x)^4\\
  2.125 = 14400(1-x)^4\\
  x \approx 0.89
\end{equation}

### Plots

Just to get a more visual understanding of the problem, I'm including some additional plots.

First, looking at percentage of distance covered as a function of shots for a "par-level" player (covering 89% of the distance per shot),

{% highlight R %}
x <- 0:6
y<-lapply(x, {function (i) (1-0.89)^i})
plot(x, y, col="firebrick",
     xlab="Shot Number", 
     ylab="Percent of Total Distance Remaining" )
{% endhighlight %}

![center](/blogimages/golf_percentages/distance_v_percent.png)


Next, the number of strokes to make it in a hole at 400 yards for various distance percentage values. Solving for N gives,

\begin{equation}
  \frac{14400}{2.125} = (1-x)^N\\
  N = \frac{\ln(14400/2.125)}{\ln(1-x)}
\end{equation}

Of course, N is constrained to $$\Bbb Z^+$$ (positive integers), so a ceiling round is applied.


{% highlight R%}
x <- seq(0.05,0.95,0.05)
y <- lapply(x, {function (x) (ceiling(log(2.125/14400)/log(1-x))) })
plot(x, y, col="firebrick",
     xlab="Percent Distance Covered per Shot", 
     ylab="Shots Needed to Reach Hole" )
{% endhighlight %}

![center](/blogimages/golf_percentages/shots_v_distance.png)
