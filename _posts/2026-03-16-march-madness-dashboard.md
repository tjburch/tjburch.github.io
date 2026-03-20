---
layout: single
title: "March Madness 2026 — Interactive Forecast Dashboard"
date: 2026-03-16
permalink: /march-madness-2026/
categories: Statistics
tags: [bayesian, interactive, march-madness]
series: march-madness-2026
series_title: "March Madness 2026"
classes: wide
author_profile: false
toc: false
share: true
comments: false
excerpt: "Live Bayesian bracket predictions for the 2026 NCAA Tournament, updated daily."
header:
  og_image: /blogimages/march-madness-2026/championship_odds.png
---

<div id="mm-dashboard">

  <div class="mm-header">
    <p class="mm-subtitle">
      Bracket forecasts from a latent offense+defense skill hierarchical model fit with PyMC.
      <br>
      <a href="/blog/statistics/march-madness-2026">Read the methodology →</a>
    </p>
  </div>

  <div class="mm-controls">
    <div class="mm-gender-toggle" id="gender-toggle">
      <button class="mm-toggle-btn active" data-gender="M">Men's</button>
      <button class="mm-toggle-btn" data-gender="W">Women's</button>
    </div>
    <div class="mm-date-selector" id="date-selector">
      <label for="snapshot-date">Snapshot:</label>
      <select id="snapshot-date"></select>
    </div>
  </div>

  <div class="mm-loading" id="loading-indicator">
    <div class="mm-spinner"></div>
    Loading forecast data...
  </div>

  <div class="mm-content" id="dashboard-content" style="display:none;">

    <section class="mm-section" id="section-championship">
      <h2>Championship Odds</h2>
      <div id="championship-chart"></div>
    </section>

    <section class="mm-section" id="section-heatmap">
      <h2>Advancement Probabilities</h2>
      <div id="advancement-heatmap"></div>
    </section>

    <section class="mm-section" id="section-brackets">
      <h2>Region Brackets</h2>
      <div class="mm-region-tabs" id="region-tabs">
        <button class="mm-region-tab active" data-region="W">West</button>
        <button class="mm-region-tab" data-region="X">East</button>
        <button class="mm-region-tab" data-region="Y">South</button>
        <button class="mm-region-tab" data-region="Z">Midwest</button>
      </div>
      <div id="region-bracket-content"></div>
    </section>

    <section class="mm-section" id="section-team-detail" style="display:none;">
      <h2 id="team-detail-title">Team Deep Dive</h2>
      <div class="mm-team-header" id="team-detail-header"></div>
      <div class="mm-team-charts">
        <div id="team-advancement-chart"></div>
        <div id="team-timeline-chart"></div>
      </div>
    </section>

    <section class="mm-section" id="section-predictions">
      <h2>Predictions vs. Reality</h2>
      <div id="predictions-content"></div>
    </section>

  </div>
</div>

<script src="https://cdn.plot.ly/plotly-2.35.0.min.js"></script>
<script src="/assets/js/march-madness-dashboard.js"></script>

<div style="text-align: center; margin-top: 2em; padding-top: 1em; border-top: 1px solid #e0e0e0;">
<script type="text/javascript" src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js" data-name="bmc-button" data-slug="tylerjamesburch" data-color="#f0a400" data-emoji=""  data-font="Comic" data-text="Buy me a coffee" data-outline-color="#000000" data-font-color="#000000" data-coffee-color="#FFDD00" ></script>
</div>
