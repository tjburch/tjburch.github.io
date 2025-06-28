---
layout: single
title: " "
permalink: /blog/
author_profile: true
classes: wide
excerpt: "Technical posts on baseball analytics, data science, and physics research"
---

<!-- Load KaTeX - Updated to latest version -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js" integrity="sha384-cpW21h6RZv/phavutF+AuVYrr+dA8xD9zs6FwLpaCct6O9ctzYFfFr4dgmgccOTx" crossorigin="anonymous"></script>

<div class="blog-content">
  <!-- Title and filter buttons side by side -->
  <div class="blog-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
    <h1 style="margin: 0; color: var(--text-light);">Blog</h1>
    <div class="category-nav">
      <button class="filter-btn active" data-category="all" style="margin: 0 0.25rem; padding: 0.3rem 0.7rem; background: #e9a94a; color: #282827; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">All Posts</button>
      {% assign categories = site.posts | map: 'categories' | join: ',' | split: ',' | uniq | sort %}
      {% for category in categories %}
        {% unless category == '' %}
        <button class="filter-btn" data-category="{{ category }}" style="margin: 0 0.25rem; padding: 0.3rem 0.7rem; background: transparent; color: #e9a94a; border: 1px solid #e9a94a; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">{{ category }}</button>
        {% endunless %}
      {% endfor %}
    </div>
  </div>

  <!-- All posts in chronological order -->
  <div class="post-list">
    {% assign sorted_posts = site.posts | sort: 'date' | reverse %}
    {% for post in sorted_posts %}
    <div class="post-item" data-categories="{{ post.categories | join: ',' }}">
      <a href="{{ site.baseurl }}{{ post.url }}" class="post-link">
        <div class="post-layout">
          <div class="post-left">
            <div class="post-title">{{ post.title }}</div>
            {% if post.excerpt %}<div class="post-excerpt">{{ post.excerpt | strip_html | truncate: 120 }}</div>{% endif %}
          </div>
          <div class="post-right">
            <div class="post-date">{{ post.date | date: "%B %d, %Y" }}</div>
            <div class="post-categories">
              {% for category in post.categories %}
                <span class="category-tag">{{ category }}</span>
              {% endfor %}
            </div>
          </div>
        </div>
      </a>
    </div>
    {% endfor %}
  </div>
</div>

<script type="text/javascript">
  // Updated KaTeX rendering for latest version
  document.addEventListener("DOMContentLoaded", function() {
    // Render math expressions
    var mathElements = document.querySelectorAll("script[type='math/tex']");
    mathElements.forEach(function(element) {
      var tex = element.textContent;
      var rendered = katex.renderToString(tex, {displayMode: false});
      var span = document.createElement('span');
      span.innerHTML = rendered;
      element.parentNode.replaceChild(span, element);
    });

    var displayMathElements = document.querySelectorAll("script[type='math/tex; mode=display']");
    displayMathElements.forEach(function(element) {
      var tex = element.textContent.replace(/%.*/g, '');
      var rendered = katex.renderToString(tex, {displayMode: true});
      var div = document.createElement('div');
      div.innerHTML = rendered;
      element.parentNode.replaceChild(div, element);
    });

    // Blog post filtering functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const postItems = document.querySelectorAll('.post-item');

    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        
        // Update active button
        filterButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.style.background = 'transparent';
          btn.style.color = '#e9a94a';
        });
        this.classList.add('active');
        this.style.background = '#e9a94a';
        this.style.color = '#282827';

        // Filter posts
        postItems.forEach(post => {
          const postCategories = post.getAttribute('data-categories').toLowerCase();
          
          if (category === 'all' || postCategories.includes(category.toLowerCase())) {
            post.style.display = 'block';
          } else {
            post.style.display = 'none';
          }
        });
      });
    });
  });
</script>

<!-- Consider adding: Search functionality, Tag cloud, or Recent posts widget -->