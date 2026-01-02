---
layout: single
title: " "
permalink: /blog/
author_profile: true
classes: wide
excerpt: "Technical posts on baseball analytics, data science, and physics research"
---

<div class="blog-content">
  <div class="blog-header">
    <h1>Blog</h1>
    <div class="category-nav">
      <button class="filter-btn active" data-category="all">All Posts</button>
      {% assign categories = site.posts | map: 'categories' | join: ',' | split: ',' | uniq | sort %}
      {% for category in categories %}
        {% unless category == '' %}
        <button class="filter-btn" data-category="{{ category }}">{{ category }}</button>
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
  document.addEventListener("DOMContentLoaded", function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const postItems = document.querySelectorAll('.post-item');

    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const category = this.getAttribute('data-category');

        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        postItems.forEach(post => {
          const postCategories = post.getAttribute('data-categories').toLowerCase();
          post.style.display = (category === 'all' || postCategories.includes(category.toLowerCase())) ? 'block' : 'none';
        });
      });
    });
  });
</script>