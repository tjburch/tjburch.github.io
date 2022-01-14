---
layout: post
title: "Baseball Data in Julia"
date: 2022-01-10
categories: Baseball
tags: [baseball, julia]
---

**tl;dr** - see [this GitHub gist](https://gist.github.com/tjburch/364f244688e0942d5d4cb0ae28cfa053)

## Background

For a couple years now, I've been super interested in the Julia language. One issue I had when when I was doing public-facing baseball work, is that there are great libraries in both Python ([pybaseball](https://github.com/jldbc/pybaseball)) and R ([baseballr](https://billpetti.github.io/baseballr/)) for loading in baseball data, but no such library for Julia (yet!). Luckily, Julia has great interoperability support, so we can utilize those libraries to pull baseball data into Julia DataFrames - it just takes a little bit of massaging. 

## pybaseball

Prerequisite: a working Python installation with pybaseball installed, which can be installed via pip. I recommend creating a designated Python virtual environment to work with Julia, and when you build PyCall, set `ENV["PYTHON"] = venv/bin/python3`. Activate that virtual environment and run `pip install pybaseball`

For interoperability with Python, Julia has [PyCall.jl](https://github.com/JuliaPy/PyCall.jl). Once loaded into Julia, use `pyimport` to load pybaseball into your Julia session. The methods within pybaseball return Pandas Dataframes, which If you're interested in using Pandas.jl, the conversion is straightforward, however it's not trivial to get to Julia's DataFrames. The approach I've found is to immediately use the `pandas.DataFrame.to_csv`, method without a file to get the dataframe as a string. Then, read that in as an IOBuffer to CSV.jl, and sink it to a Juila Dataframe.


{% highlight julia %}
using DataFrames, PyCall, CSV
pybaseball = pyimport("pybaseball")
python_df = pybaseball.statcast("2021-04-06")
julia_df = CSV.read(IOBuffer(python_df.to_csv()), DataFrame)
{% endhighlight %}

And for an example plot...

{% highlight julia %}
using StatsPlots
@df filter(
    row -> row[:events] in ["field_out", "single", "double",  "triple", "home_run"], 
    dropmissing(julia_df, :events)
    ) StatsPlots.scatter(
        :launch_speed, 
        :launch_angle, 
        group=:events, 
        alpha=0.5, 
        xlabel="Launch Speed", 
        ylabel="Exit Angle"
    )
{% endhighlight%}

<img src="/blogimages/baseball_in_julia/example.png" class="center" style="width:50%;">

## baseballr

Prerequisite: a working R installation with baseballr installed. Open R and run the command `devtools::install_github("BillPetti/baseballr")`.

Interoperability with R is done via [RCall.jl](https://juliainterop.github.io/RCall.jl/stable/). RCall can load R libraries via the `@rlibrary` macro, which can then be used to call `baseballr` (provided the library is installed). Once the library is loaded, then you can call functions via an R string, and use `rcopy` to migrate an R dataframe to a Julia one.

{% highlight julia %}
using RCall
@rlibarary baseballr
julia_df = rcopy(R"baseballr::scrape_statcast_savant(start_date = '2021-04-06', end_date = '2021-04-06')"
{% endhighlight %}

## And there you have it!

Hopefully this enables some easier baseball analysis for others in Julia. Of course, all this work can be circumnavigated by saving dataframes from respective packages as CSVs and reading them in via `CSV.jl`, but who wants a million csvs laying around? There's probably much more performant ways to go about this, but these approaches seem the quickest and most clear to me - if you have ideas or suggestions, feel free to reach out, or possibly comment on the git gist above.