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

  <!-- Build series groups -->
  {% assign sorted_posts = site.posts | sort: 'date' | reverse %}
  {% assign series_posts = sorted_posts | where_exp: 'p', 'p.series' %}

  <div class="post-list">
    {% for post in sorted_posts %}
      {% if post.series %}
        {% comment %} Check if this is the newest post in its series {% endcomment %}
        {% assign this_series_posts = series_posts | where: 'series', post.series %}
        {% assign newest_in_series = this_series_posts | sort: 'date' | reverse | first %}

        {% if post.id == newest_in_series.id %}
          {% if this_series_posts.size == 1 %}
            {% comment %} Single-post series: render as normal post item {% endcomment %}
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
          {% else %}
            {% comment %} Multi-post series: render collapsible group {% endcomment %}
            {% assign all_categories = "" %}
            {% for sp in this_series_posts %}
              {% for cat in sp.categories %}
                {% assign all_categories = all_categories | append: cat | append: "," %}
              {% endfor %}
            {% endfor %}
            {% assign all_categories = all_categories | split: "," | uniq | join: "," %}
            {% assign oldest_in_series = this_series_posts | sort: 'date' | first %}
            {% assign series_title = this_series_posts | map: 'series_title' | compact | first | default: post.series %}

            <div class="series-group" data-categories="{{ all_categories }}">
              <details>
                <summary class="series-summary">
                  <div class="series-header">
                    <div class="series-left">
                      <span class="series-title">{{ series_title }}</span>
                      <span class="series-count">{{ this_series_posts.size }} posts</span>
                    </div>
                    <div class="series-right">
                      <span class="series-date-range">{{ oldest_in_series.date | date: "%b %d" }} – {{ newest_in_series.date | date: "%b %d, %Y" }}</span>
                    </div>
                  </div>
                </summary>
                <div class="series-posts">
                  {% assign chronological = this_series_posts | sort: 'date' %}
                  {% for sp in chronological %}
                  <a href="{{ site.baseurl }}{{ sp.url }}" class="series-post-link">
                    <span class="series-post-title">{{ sp.title }}</span>
                    <span class="series-post-date">{{ sp.date | date: "%b %d" }}</span>
                  </a>
                  {% endfor %}
                </div>
              </details>
            </div>
          {% endif %}
        {% endif %}
        {% comment %} Non-newest series posts are skipped (rendered inside the group) {% endcomment %}
      {% else %}
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
      {% endif %}
    {% endfor %}
  </div>
</div>

<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.post-item, .series-group');

    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const category = this.getAttribute('data-category');

        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        filterItems.forEach(item => {
          const itemCategories = item.getAttribute('data-categories').toLowerCase();
          item.style.display = (category === 'all' || itemCategories.includes(category.toLowerCase())) ? 'block' : 'none';
        });
      });
    });
  });
</script>