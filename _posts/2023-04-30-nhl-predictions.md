---
layout: posts
title: "2023 NHL Playoff Predictions"
date: 2023-04-30
categories: Misc
tags: [hockey, sports]
excerpt: "Who will win this year's cup?"
---

<script src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML" type="text/javascript"></script>


## Background

Earlier this NHL season, I posted [a Bayesian hierarchical model for NHL scoring](http://tylerjamesburch.com/blog/misc/hockey-bayes) in an aim to understand the skill of the Bruins based on the first 21 games (in which they went 18-3). This model has been expanded to better model NHL games (specifically the overtime structure), fit on all of 2022-2023 data to get the goal creation and suppression parameters for each team, and then used to project the remainder of the playoffs, which can be found [here](http://nhl-projections.tylerjamesburch.com).

## Methodology

### Original Model

The base of the model has remained unchanged, based on the  [Baio and Blangiardo](https://discovery.ucl.ac.uk/id/eprint/16040/1/16040.pdf) model. For regulation scoring, I fit the following model for goal scoring, $$y = (y_{g0}, y_{g1})$$, a Poisson process:

$$ y_{gj} | \theta_{gj} \sim \text{Poisson}(\theta_{gj})$$

for game $$g$$, with $$j = {0, 1}$$ an indicator variable for home ice. In their paper the rate parameter $$\theta_{gj}$$ is given by the following:

$$ \log \theta_{g0} = \alpha + h + a_{hg} - d_{vg}$$

$$ \log \theta_{g1} = \alpha + a_{vg} - d_{hg}$$

Where $$h$$ is the home ice advantage, $$a$$ is the "attack strength," $$d$$ is the "defense strength," and $$h$$ and $$v$$ denote "home" or "visitor" respectively. Last, $$\alpha$$ is a flat intercept. In words: the home scoring rate is proportional to the attack skill of the home team, minus the defense of the away team, plus home ice advantage. The away scoring rate is the opposite, with no advantage.

### Overtime 

However, some crucial updates have been made, specifically accounting for the overtime mechanisms in hockey. For games that reach overtime, the $\theta$ parameters are scaled down to the relative time frame 

1. $$\text{ot\_home\_theta} = \text{home\_theta} \times \frac{1}{K},$$
2. $$\text{ot\_away\_theta} = \text{away\_theta} \times \frac{1}{K}.$$

$$K$$ represents the scaling factor for overtime expectations. For the regular season, $$K = 12$$, since overtime is 5 minutes. In playoff games, $$K$$ is set to 3, as each overtime period lasts one-third of the time of a regulation period. This assumption implies that the goal creation and suppression parameters remain the same during overtime, a necessary compromise given the relatively small dataset of OT games.

I also introduce a custom likelihood function, which compares the observed home and away overtime goals to the expected overtime goal rates (ot_home_theta and ot_away_theta). This function is only applied to games that went into overtime. It allows only 3 possible outcomes:

1. No goals scored by either team: (0, 0)
2. Home team scores 1 goal and away team scores 0 goals: (1, 0)
3. Home team scores 0 goals and away team scores 1 goal: (0, 1)

For each allowed outcome $$(h\_goals, a\_goals)$$, we calculate the log-likelihood of the observed home and away overtime goals as follows:

$\text{log\_likelihood}_{h\_goals, a\_goals} = \log P(y_{ot\_home} | \text{ot\_home\_theta}, h\_goals) + \log P(y_{ot\_away} | \text{ot\_away\_theta}, a\_goals)$$

Here, $$P(y_{ot\_home} | \text{ot\_home\_theta}, h\_goals)$$ and $$P(y_{ot\_away} | \text{ot\_away\_theta}, a\_goals)$$ represent the probabilities of observing the home and away overtime goals, given their respective expected goal rates and the allowed outcome. And recall, these are Poisson distributed.

$$P(y_{ot\_home} | \text{ot\_home\_theta}, h\_goals) \sim \text{Poisson}(\text{ot\_home\_theta} \cdot h\_goals)$$

$$P(y_{ot\_away} | \text{ot\_away\_theta}, a\_goals) \sim \text{Poisson}(\text{ot\_away\_theta} \cdot a\_goals)$$

Then for custom likelihood function, the log-sum-exp of the log-likelihoods is as follows:

$$\text{overtime\_goals\_likelihood} = \log \left(\sum_{(h\_goals, a\_goals) \in \text{allowed\_outcomes}} \exp\left({\text{log\_likelihood}_{h\_goals, a\_goals}}\right)\right)$$

Here, $$\exp(\text{log\_likelihood}_{h\_goals, a\_goals})$$ simply represents the likelihood of observing the home and away overtime goals, given their respective expected goal rates and the allowed outcome.

### Shootouts

For regular season games, if the score is still the same after the overtime consideration, a shootout model is then introduced, modeling the probability of the home team winning the using a familiar logistic regression. I introduce team-specific coefficients for shootout success and failure, denoted by $$\text{so\_coeff\_a}$$ (success) and $$\text{so\_coeff\_d}$$ (failure), as well as an intercept term $$\text{so\_intercept}$$ and a home advantage term $$\text{so\_coeff\_h}$$. The shootout logit is calculated as follows:

$$\text{so\_logit} = \text{so\_intercept} + \text{so\_coeff\_a}[\text{home\_idx[shootout]}] - \text{so\_coeff\_a}[\text{away\_idx[shootout]}] + \text{so\_coeff\_d}[\text{home\_idx[shootout]}] - \text{so\_coeff\_d}[\text{away\_idx[shootout]}] + \text{so\_coeff\_h} \times \text{home}$$

Then, we calculate the probability of the home team winning the shootout using the logistic function:

$$\text{so\_prob} = \text{logit}^{-1}(\text{so\_logit})$$

Finally, we model the shootout_winner variable as a Bernoulli random variable with probability $$\text{so\_prob}$$:

$$\text{shootout\_winner} \sim \text{Bernoulli}(\text{so\_prob})$$

This shootout model is conditioned only on games that went to a shootout.


## Playoff Predictions

To predict playoff games, we employ a simulation-based approach using the model's posterior estimates. For each game, posterior samples of the attack and defense strengths for both the home and away teams are extracted, along with the other model parameters, then the scoring $$\theta$$ values are calculated. Additionally, using a scaling factor of $$K=3$$, possible OT scoring is calculated. Then, for each set of sampled parameters, we calculate the probability of the home team winning in both regulation and overtimes. The mean value is then compared to a random number 0-1 to simulate if the home team wins or not.

This formulation is run for all potential matchups in the cup, and once a team hits 4 wins in a series, they advance. 500 simulations of the entire tournament are ran daily, and the probability reported is the number of simulations in which a team wins a given round.

All code can be found [here](https://github.com/tjburch/nhl-predictions).