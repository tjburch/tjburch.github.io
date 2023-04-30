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

$$ \theta_{h,o} = \theta_h \times \frac{1}{K},$$

$$ \theta_{a,o} = \theta_a \times \frac{1}{K}.$$

$$K$$ represents the scaling factor for overtime expectations. For the regular season, $$K = 12$$, since overtime is 5 minutes. In playoff games, $$K$$ is set to 3, as each overtime period lasts one-third of the time of a regulation period. This assumption implies that the goal creation and suppression parameters remain the same during overtime, a necessary compromise given the relatively small dataset of OT games.

I also introduce a custom likelihood function, which compares the observed home and away overtime goals to the expected overtime goal rates (ot_home_theta and ot_away_theta). This function is only applied to games that went into overtime. It allows only 3 possible outcomes:

1. No goals scored by either team: (0, 0)
2. Home team scores 1 goal and away team scores 0 goals: (1, 0)
3. Home team scores 0 goals and away team scores 1 goal: (0, 1)

For each allowed outcome $$(h\_goals, a\_goals)$$, we calculate the log-likelihood of the observed home and away overtime goals as follows:

$$\text{loglikelihood}_{h_g, a_g} = \log P(y_{h,ot} | \theta_{h,ot}, h_g) + \log P(y_{a,ot} | \theta_{a,ot}, a_g)$$

Here, $$P(y_{h,ot}) $$ and $$P(y_{a,ot})$$ represent the probabilities of observing the home and away overtime goals, given their respective expected goal rates and the allowed outcome. And recall, these are Poisson distributed.

$$P(y_{h,ot} | \theta_{h,ot}, h_g) \sim \text{Poisson}(\theta_{h,ot} \cdot h_g)$$

$$P(y_{a,ot} | \theta_{a,ot}, a_g) \sim \text{Poisson}(\theta_{a,ot} \cdot a_g)$$

Then for custom likelihood function, the log-sum-exp of the log-likelihoods is as follows:

$$\text{OT goals likelihood} = \log \left(\sum_{(h_g, a_g) \in \text{outcomes}} \exp\left({\text{loglikelihood}_{h_g, a_g}}\right)\right)$$

Here, $$\exp(\text{loglikelihood}_{h_g, a_g})$$ simply represents the likelihood of observing the home and away overtime goals, given their respective expected goal rates and the allowed outcome.

### Shootouts

For regular season games, if the score is still the same after the overtime consideration, a shootout model is then introduced, modeling the probability of the home team winning the using a familiar logistic regression. I introduce team-specific coefficients for shootout success and failure, denoted by $$so_o$$ (success) and $$so_d$$ (failure), as well as an intercept term $$so_i$$ and a home advantage term $$so_{adv}$$. Then, we calculate the probability of the home team winning the shootout using the logistic function:

$$ \text{logit}(so_{P_\text{home}}) = so_i + (so_{o,h} - so_{o,a}) + (so_{d,h} - so_{d,a}) + so_{adv} * h_i $$

Finally, we model the shootout_winner variable as a Bernoulli random variable with probability $$so_{P_\text{home}}$$:

$$\text{shootout winner} \sim \text{Bernoulli}(so_{P_\text{home}})$$

This shootout model is conditioned only on games that went to a shootout.

Frankly, I believe all this is far more transparent with code. So without further ado,

```python
home_idx, teams = pd.factorize(data["home_team"], sort=True)
away_idx, _ = pd.factorize(data["away_team"], sort=True)

coords = {
    "team": teams,
    "match": np.arange(len(data)),
}

with pm.Model(coords=coords) as model:
    # Global model parameters
    intercept = pm.Normal("intercept", mu=0, sigma=2)
    home = pm.Normal("home", mu=0, sigma=0.2)

    # Hyperpriors for attacks and defs
    sd_att = pm.HalfCauchy("sd_att", 0.2)
    sd_def = pm.HalfCauchy("sd_def", 0.2)

    # Team-specific model parameters
    atts_star = pm.Normal("atts_star", mu=0, sigma=sd_att, dims="team")
    defs_star = pm.Normal("defs_star", mu=0, sigma=sd_def, dims="team")

    # Demeaned team-specific parameters
    atts = pm.Deterministic("atts", atts_star - at.mean(atts_star), dims="team")
    defs = pm.Deterministic("defs", defs_star - at.mean(defs_star), dims="team")

    # Expected goals for home and away teams during regulation
    home_theta = at.exp(intercept + home + atts[home_idx] - defs[away_idx])
    away_theta = at.exp(intercept + atts[away_idx] - defs[home_idx])

    # Likelihood (Poisson distribution) for regulation goals
    home_points = pm.Poisson("home_points", mu=home_theta, observed=data['home_goals'], dims="match")
    away_points = pm.Poisson("away_points", mu=away_theta, observed=data['away_goals'], dims="match")

    # Overtime and shootout deterministics
    overtime = data['home_goals'] == data['away_goals']
    shootout = (data['home_goals_ot'] == data['away_goals_ot']) & overtime

    # Expected goals for home and away teams during overtime (scaled down by 1/12)
    ot_home_theta = home_theta * (1 / 12)
    ot_away_theta = away_theta * (1 / 12)

    # Likelihood (custom likelihood function) for overtime goals
    if overtime.sum() > 0:
        pm.Potential("ot_goals_constraint",
                    overtime_goals_likelihood(data.home_goals_ot, data.away_goals_ot, ot_home_theta, ot_away_theta))

    # Shootout model (conditioned on games that went to shootout)
    so_coeff_o = pm.Normal("so_coeff_o", mu=0, sigma=1, dims="team")  # Offensive shootout coefficient
    so_coeff_d = pm.Normal("so_coeff_d", mu=0, sigma=1, dims="team")  # Defensive shootout coefficient
    so_coeff_h = pm.Normal("so_coeff_h", mu=0, sigma=1)  # Home advantage coefficient
    so_intercept = pm.Normal("so_intercept", mu=0, sigma=1)  # Intercept term

    so_logit = (so_intercept +
                so_coeff_o[home_idx[shootout]] - so_coeff_o[away_idx[shootout]] +
                so_coeff_d[home_idx[shootout]] - so_coeff_d[away_idx[shootout]] +
                so_coeff_h * home)

    if shootout.sum() > 0:
        so_prob = pm.math.invlogit(so_logit)
        shootout_winner = pm.Bernoulli("shootout_winner", p=so_prob, observed=data['shootout_winner'][shootout])

    trace = pm.sample(4000, tune=3000)
return model, trace
```


## Playoff Predictions

To predict playoff games, we employ a simulation-based approach using the model's posterior estimates. For each game, posterior samples of the attack and defense strengths for both the home and away teams are extracted, along with the other model parameters, then the scoring $$\theta$$ values are calculated. Additionally, using a scaling factor of $$K=3$$, possible OT scoring is calculated. Then, for each set of sampled parameters, we calculate the probability of the home team winning in both regulation and overtimes. The mean value is then compared to a random number 0-1 to simulate if the home team wins or not.

This formulation is run for all potential matchups in the cup, and once a team hits 4 wins in a series, they advance. 500 simulations of the entire tournament are ran daily, and the probability reported is the number of simulations in which a team wins a given round.

All code can be found [here](https://github.com/tjburch/nhl-predictions).