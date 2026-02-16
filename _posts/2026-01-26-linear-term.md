---
layout: posts
title: "linear-term - a TUI for Linear"
date: 2026-01-26
categories: Misc
tags: [python, tools, cli, terminal]
excerpt: "A terminal user interface for Linear project management"
header:
  og_image: /blogimages/linear-term/main-view.png
---

# Background

A little over a decade ago, toward the start of my Ph.D., I started programming for real work for the first time. I was doing data analysis in C++ using [ROOT](https://en.wikipedia.org/wiki/ROOT) (and yes, data analysis in C++ is as awful as it sounds). At the time, My advisor was the first person to introduce me to a terminal and to emacs. I'm pretty sure when I wasn't looking, he aliased  `emacs = emacs -nw` just so I wouldn't even have to use the emacs GUI.

In 2018, I switched to VSCode. The integrated terminal made it feel like a one-stop-shop - everything in one program, no context switching, plus a rich editing experience. But I've always missed parts of a terminal-only workflow, and lately I've been drifting back to it.

This has made me a sucker for terminal-based tooling. One friction point I noticed recently: there isn't a good terminal user interface (TUI) for [Linear](https://linear.app) project management, which forces me to context-switch into the native app to log progress, comment on issues, etc. So this past weekend I hacked together my own.

# linear-term

`linear-term` is the TUI I put together (repo [here](https://github.com/tjburch/linear-term)). It was built using `textual` in python. The original design was intended to look similar to the native app, but within the terminal. 

![Main view](/blogimages/linear-term/main-view.png)

It's a 3-panel layout: the center shows your issues, the right panel shows issue details once selected, and the left panel has filtering options. You can toggle through each via `TAB` or `F1`, `F2`, `F3`.

I also created a kanban board view, accessible via `b`, where you can look at issues by their status.

![Kanban board view](/blogimages/linear-term/kanban-view.png)

I also added some CLI tools. There are existing Linear CLIs out there, but I wanted this to be enough of a one-stop-shop that you didn't have to install a bunch of other tools.

For example:

```bash
$ linear-term list --mine
TJB-1 [Backlog] --- Get familiar with Linear @Tyler Burch
TJB-4 [Done] --- Import your data @Tyler Burch
TJB-3 [In Progress] --- Connect your tools @Tyler Burch
TJB-2 [Todo] --- Set up your teams @Tyler Burch
```

I mainly put this together for my own use, but please feel free to use it if you're interested. Happy to hear feedback, or take contributions too.