---
layout: single
classes: wide
title: "Open Source Contributions in 2026"
date: 2026-09-16
permalink: /blog/open-source/open-source-contributions
last_modified_at: 2026-09-16
living: true
categories: Software
tags: [open-source]
toc: false
excerpt: "My open source contributions in 2026."
---

Below are changes merged in 2026 and active pull requests I've submitted to open-source projects this year. Dates show when merged changes landed or when active contributions were submitted.

<div class="contribution-summary" aria-label="Contribution summary">
  <strong>5 contributions</strong>
  <span>Last updated <time datetime="2026-09-16">September 16, 2026</time></span>
</div>

<ol class="contribution-ledger">
  <li class="contribution-ledger__entry">
    <div class="contribution-ledger__event">
      <time datetime="2026-02-24">Feb 24</time>
      <span class="contribution-status contribution-status--merged">Merged</span>
    </div>
    <div class="contribution-ledger__content">
      <h2 id="tune-control-printing"><code>tune</code> — Clearer printing for control objects</h2>
      <a class="contribution-ledger__pr" href="https://github.com/tidymodels/tune/pull/1108">PR #1108</a>
      <p>A small quality-of-life addition to help out a library I've used a lot. Added dedicated print methods that use <code>cli</code> to show settings such as verbosity, parallel processing, prediction storage, and event levels as a readable list. This makes control objects (and their defaults) faster to inspect.</p>
    </div>
  </li>

  <li class="contribution-ledger__entry">
    <div class="contribution-ledger__event">
      <time datetime="2026-04-17">Apr 17</time>
      <span class="contribution-status contribution-status--merged">Merged</span>
    </div>
    <div class="contribution-ledger__content">
      <h2 id="finetune-resample-weights"><code>finetune</code> — Preserve resample weights in racing methods</h2>
      <a class="contribution-ledger__pr" href="https://github.com/tidymodels/finetune/pull/135">PR #135</a>
      <p>Last year I <a href="https://github.com/tidymodels/tune/pull/1007">contributed fold weights to <code>tune</code></a> to help enable variable-sized folds. While testing them with racing methods, I noticed that <code>randomize_resamples()</code> did not carry them correctly. This PR fixed that.</p>
    </div>
  </li>

  <li class="contribution-ledger__entry">
    <div class="contribution-ledger__event">
      <time datetime="2026-09-05">Sep 5</time>
      <span class="contribution-status contribution-status--open">Open</span>
    </div>
    <div class="contribution-ledger__content">
      <h2 id="arviz-stats-bivariate-histograms"><code>arviz-stats</code> — Add bivariate histogram and hexbin statistics</h2>
      <a class="contribution-ledger__pr" href="https://github.com/arviz-devs/arviz-stats/pull/438">PR #438</a>
      <p>Added public <code>histogram2d()</code> and <code>hexbin()</code> functions with support for NumPy, xarray, batched computation, weights, density normalization, explicit extents, and nonfinite samples. This gives every ArviZ plotting backend the same binning logic and the edges or centers needed to draw matching binned 2D distributions.</p>
    </div>
  </li>

  <li class="contribution-ledger__entry">
    <div class="contribution-ledger__event">
      <time datetime="2026-09-06">Sep 6</time>
      <span class="contribution-status contribution-status--open">Open</span>
    </div>
    <div class="contribution-ledger__content">
      <h2 id="arviz-stats-nested-rhat"><code>arviz-stats</code> — Support short chains in nested R-hat</h2>
      <a class="contribution-ledger__pr" href="https://github.com/arviz-devs/arviz-stats/pull/442">PR #442</a>
      <p>Made the minimum draw requirement for <code>rhat_nested()</code> depend on the estimator, allowing one draw per chain for the identity method and two for split-based methods (while handling several short-chain edge cases). This supports GPU-friendly sampling workflows that run many short chains in parallel. The previous shared validation did not support that use case, returning <code>nan</code> for valid inputs with fewer than four draws.</p>
    </div>
  </li>

  <li class="contribution-ledger__entry">
    <div class="contribution-ledger__event">
      <time datetime="2026-09-08">Sep 8</time>
      <span class="contribution-status contribution-status--open">Open</span>
    </div>
    <div class="contribution-ledger__content">
      <h2 id="bambi-nonlinear-formulas"><code>bambi</code> — Add nonlinear formulas</h2>
      <a class="contribution-ledger__pr" href="https://github.com/bambinos/bambi/pull/1006">PR #1006</a>
      <p>Added nonlinear expressions for likelihood parent parameters while retaining ordinary Bambi formulas for each named parameter, including common, group-specific, and offset terms. This brings nonlinear models into Bambi's existing formula, prior, prediction, and link machinery, enabling a new class of models. One example is the classic Gelman golf model, which I reproduced end to end.</p>
    </div>
  </li>
</ol>
