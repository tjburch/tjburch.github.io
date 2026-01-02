---
layout: home-wide
title: " "
excerpt: " "
author_profile: false
classes: wide
---

<meta name="p:domain_verify" content="6e3f1c80a8a83df3c2ef4cc142008abd"/>

<div class="professional-hero">
  <div class="hero-content">
    <div class="hero-image">
      <img src="images/podium.jpg" alt="Tyler James Burch" class="professional-portrait" />
    </div>
    
    <div class="hero-text">
      <h1 class="hero-name">Tyler James Burch</h1>
      <p class="hero-title">Senior Data Analyst, Baseball Analytics</p>
      <p class="hero-company">Boston Red Sox</p>
      
      <div class="hero-description">
        <p>Applying research methods, statistics, machine learning, and Bayesian modeling to solve problems in professional baseball analytics.</p>
      </div>
      
      <div class="hero-cta">
        <a href="/about" class="cta-button secondary">About Me</a>
        <a href="/blog" class="cta-button primary">View My Work</a>
      </div>
    </div>
  </div>
</div>

<div class="highlights-section">
  <div class="highlights-grid">
    <div class="highlight-card">
      <h3>Baseball Analytics</h3>
      <p>Advanced statistical modeling and machine learning applications in professional baseball operations and player evaluation.</p>
    </div>
    
    <div class="highlight-card">
      <h3>Data Science</h3>
      <p>Expertise in Python, R, machine learning, and Bayesian methods for complex analytical challenges.</p>
    </div>
    
    <div class="highlight-card">
      <h3>Technical Computing</h3>
      <p>Experience writing scalable software for some of the world's largest datasets, on some of the world's fastest computers.</p>
    </div>
    
    <div class="highlight-card">
      <h3>Research Background</h3>
      <p>Earned a Ph.D. in particle physics, and completed postdoctoral research in machine learning and physics simulation.</p>
    </div>
  </div>
</div>

<div class="recent-work-section">
  <h2>Recent Blog Posts</h2>
  <div class="recent-posts">
    {% for post in site.posts limit:3 %}
      <article class="recent-post-card">
        <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
        <p class="post-meta">{{ post.date | date: "%B %d, %Y" }}</p>
        <p class="post-excerpt">{{ post.excerpt | strip_html | truncatewords: 20 }}</p>
      </article>
    {% endfor %}
  </div>
  <div class="view-all">
    <a href="/blog" class="view-all-link">View All Posts →</a>
  </div>
</div>