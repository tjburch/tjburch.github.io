/**
 * March Madness 2026 Interactive Dashboard
 * Loads JSON snapshots and renders Plotly.js charts.
 */
(function () {
  "use strict";

  const DATA_BASE = "/assets/data/march-madness-2026";
  const REGION_NAMES = { W: "West", X: "East", Y: "South", Z: "Midwest" };
  const ROUND_NAMES = [
    "Round of 64",
    "Round of 32",
    "Sweet 16",
    "Elite Eight",
    "Final Four",
    "Championship",
    "Champion",
  ];
  const PLOTLY_LAYOUT_BASE = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(26,26,26,0.8)",
    font: { family: "DM Sans, sans-serif", color: "#f4f4f4" },
    margin: { l: 10, r: 10, t: 30, b: 10 },
  };
  const PLOTLY_CONFIG = {
    responsive: true,
    displayModeBar: false,
  };

  // State
  let state = {
    gender: "M",
    date: null,
    snapshot: null,
    branding: null,
    timeline: null,
    availableDates: [],
  };

  // ─── Formatting ─────────────────────────────────────────────────

  function fmtPct(val) {
    if (val >= 0.999) return ">99.9%";
    if (val <= 0.001 && val > 0) return "<0.1%";
    if (val <= 0) return "0.0%";
    return (val * 100).toFixed(1) + "%";
  }

  // ─── Initialization ───────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    readUrlParams();
    setupGenderToggle();
    setupRegionTabs();
    await loadBranding();
    await loadAvailableDates();
    await loadSnapshot();
  }

  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gender") === "W") state.gender = "W";
    if (params.get("date")) state.date = params.get("date");
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (state.gender !== "M") params.set("gender", state.gender);
    if (state.date && state.date !== state.availableDates[state.availableDates.length - 1]) {
      params.set("date", state.date);
    }
    const qs = params.toString();
    const url = window.location.pathname + (qs ? "?" + qs : "");
    window.history.replaceState(null, "", url);
  }

  // ─── Controls ─────────────────────────────────────────────────────

  function setupGenderToggle() {
    document.querySelectorAll(".mm-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        document.querySelectorAll(".mm-toggle-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.gender = btn.dataset.gender;
        state.date = null;
        state.timeline = null;
        updateUrl();
        await loadAvailableDates();
        await loadSnapshot();
      });
    });
    document.querySelectorAll(".mm-toggle-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.gender === state.gender);
    });
  }

  function setupDateSelector() {
    const sel = document.getElementById("snapshot-date");
    sel.innerHTML = "";
    state.availableDates.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = formatDate(d);
      if (d === state.date) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.onchange = async () => {
      state.date = sel.value;
      updateUrl();
      await loadSnapshot();
    };
  }

  function setupRegionTabs() {
    document.querySelectorAll(".mm-region-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".mm-region-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        renderRegionBracket(tab.dataset.region);
      });
    });
  }

  // ─── Data Loading ─────────────────────────────────────────────────

  async function loadBranding() {
    try {
      const resp = await fetch(`${DATA_BASE}/team_branding.json`);
      state.branding = await resp.json();
    } catch (e) {
      console.warn("Could not load team branding:", e);
      state.branding = {};
    }
  }

  async function loadAvailableDates() {
    const genderDir = state.gender === "M" ? "mens" : "womens";
    try {
      const resp = await fetch(`${DATA_BASE}/${genderDir}/odds_timeline.json`);
      const timeline = await resp.json();
      state.availableDates = timeline.dates || [];
    } catch (e) {
      state.availableDates = ["2026-03-17"];
    }
    if (!state.date || !state.availableDates.includes(state.date)) {
      state.date = state.availableDates[state.availableDates.length - 1] || "2026-03-17";
    }
    setupDateSelector();
  }

  async function loadSnapshot() {
    showLoading(true);
    const genderDir = state.gender === "M" ? "mens" : "womens";
    try {
      const resp = await fetch(`${DATA_BASE}/${genderDir}/snapshots/${state.date}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      state.snapshot = await resp.json();
    } catch (e) {
      console.error("Failed to load snapshot:", e);
      showLoading(false);
      document.getElementById("dashboard-content").style.display = "block";
      document.getElementById("dashboard-content").innerHTML =
        '<p class="mm-no-data">Failed to load forecast data. Please try refreshing the page.</p>';
      return;
    }

    if (!state.timeline) {
      try {
        const resp = await fetch(`${DATA_BASE}/${genderDir}/odds_timeline.json`);
        state.timeline = await resp.json();
      } catch (e) {
        state.timeline = null;
      }
    }

    renderAll();
    showLoading(false);
  }

  function showLoading(show) {
    document.getElementById("loading-indicator").style.display = show ? "flex" : "none";
    document.getElementById("dashboard-content").style.display = show ? "none" : "block";
  }

  // ─── Rendering ────────────────────────────────────────────────────

  function renderAll() {
    renderChampionshipChart();
    renderAdvancementHeatmap();
    renderRegionBracket(getActiveRegion());
    renderPredictions();
    hideTeamDetail();
  }

  function getActiveRegion() {
    const active = document.querySelector(".mm-region-tab.active");
    return active ? active.dataset.region : "W";
  }

  // ─── Championship Odds Bar Chart ─────────────────────────────────

  function renderChampionshipChart() {
    const snap = state.snapshot;
    if (!snap) return;

    const sorted = Object.entries(snap.championship_odds)
      .map(([tid, odds]) => ({ tid, odds, team: snap.teams[tid] }))
      .filter((d) => d.team)
      .sort((a, b) => b.odds - a.odds)
      .slice(0, 20);

    const teamNames = sorted.map((d) => `(${d.team.seed_num}) ${d.team.name}`).reverse();
    const odds = sorted.map((d) => d.odds).reverse();

    const colors = sorted.map((d) => {
      if (d.team.eliminated) return "#444444";
      const b = state.branding[d.tid];
      return b && b.primary_color ? b.primary_color : "#f0a500";
    }).reverse();

    const hoverText = sorted.map((d) => `${d.team.name}: ${fmtPct(d.odds)}`).reverse();

    const trace = {
      type: "bar",
      orientation: "h",
      y: teamNames,
      x: odds,
      marker: {
        color: colors,
        line: { color: "rgba(255,255,255,0.15)", width: 0.5 },
      },
      hovertext: hoverText,
      hoverinfo: "text",
      text: sorted.map((d) => fmtPct(d.odds)).reverse(),
      textposition: "outside",
      textfont: { size: 11, color: "#f4f4f4" },
    };

    const maxOdds = Math.max(...odds);
    const layout = {
      ...PLOTLY_LAYOUT_BASE,
      height: Math.max(500, sorted.length * 32),
      xaxis: {
        tickformat: ".1%",
        gridcolor: "rgba(255,255,255,0.06)",
        zeroline: false,
        range: [0, Math.min(maxOdds * 1.35, 1)],
      },
      yaxis: {
        tickfont: { size: 12 },
        automargin: true,
      },
      margin: { l: 160, r: 70, t: 10, b: 40 },
    };

    Plotly.newPlot("championship-chart", [trace], layout, PLOTLY_CONFIG);

    document.getElementById("championship-chart").on("plotly_click", (data) => {
      const idx = sorted.length - 1 - data.points[0].pointIndex;
      showTeamDetail(sorted[idx].tid);
    });
  }

  // ─── Advancement Heatmap ──────────────────────────────────────────

  function renderAdvancementHeatmap() {
    const snap = state.snapshot;
    if (!snap) return;

    const topN = 40;
    const sorted = Object.entries(snap.championship_odds)
      .map(([tid, odds]) => ({ tid, odds, team: snap.teams[tid] }))
      .filter((d) => d.team)
      .sort((a, b) => b.odds - a.odds)
      .slice(0, topN);

    const roundCols = ROUND_NAMES.slice(1);
    const teamLabels = sorted.map((d) => {
      const label = `(${d.team.seed_num}) ${d.team.name}`;
      return d.team.eliminated ? `${label}  ✗` : label;
    }).reverse();

    const z = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const adv = snap.advancement[sorted[i].tid];
      z.push(roundCols.map((r) => (adv ? adv[r] || 0 : 0)));
    }

    const annotations = [];
    for (let row = 0; row < z.length; row++) {
      for (let col = 0; col < z[row].length; col++) {
        const val = z[row][col];
        if (val >= 0.005) {
          annotations.push({
            x: roundCols[col],
            y: teamLabels[row],
            text: fmtPct(val),
            showarrow: false,
            font: {
              size: 8,
              color: val > 0.65 ? "#1a1a1a" : "#e0e0e0",
            },
          });
        }
      }
    }

    const trace = {
      type: "heatmap",
      z: z,
      x: roundCols,
      y: teamLabels,
      colorscale: [
        [0, "#1e1e1e"],
        [0.005, "#2d1f1f"],
        [0.05, "#4a2222"],
        [0.15, "#7a2e2e"],
        [0.35, "#b84035"],
        [0.55, "#d95030"],
        [0.75, "#e8783a"],
        [1, "#f5b041"],
      ],
      showscale: true,
      colorbar: {
        title: { text: "P", font: { size: 11 } },
        tickformat: ".0%",
        len: 0.5,
        thickness: 12,
      },
      hoverongaps: false,
      hovertemplate: "%{y}<br>%{x}: %{z:.1%}<extra></extra>",
      zmin: 0,
      zmax: 1,
    };

    const layout = {
      ...PLOTLY_LAYOUT_BASE,
      height: Math.max(600, sorted.length * 22),
      annotations: annotations,
      xaxis: {
        side: "top",
        tickangle: -30,
        tickfont: { size: 11 },
      },
      yaxis: {
        tickfont: { size: 10 },
        automargin: true,
      },
      margin: { l: 160, r: 60, t: 80, b: 10 },
    };

    Plotly.newPlot("advancement-heatmap", [trace], layout, PLOTLY_CONFIG);

    document.getElementById("advancement-heatmap").on("plotly_click", (data) => {
      const rowIdx = data.points[0].pointIndex[0];
      const tid = sorted[sorted.length - 1 - rowIdx].tid;
      showTeamDetail(tid);
    });
  }

  // ─── Region Bracket Tables ────────────────────────────────────────

  function renderRegionBracket(regionCode) {
    const snap = state.snapshot;
    if (!snap) return;

    const container = document.getElementById("region-bracket-content");
    const regionTeams = Object.entries(snap.teams)
      .filter(([, t]) => t.region === regionCode)
      .map(([tid, t]) => ({ tid, ...t }))
      .sort((a, b) => a.seed_num - b.seed_num);

    const roundCols = ["R32", "S16", "E8", "F4", "Champ"];
    const roundKeys = ["Round of 32", "Sweet 16", "Elite Eight", "Final Four", "Champion"];

    let html = '<table class="mm-bracket-table"><thead><tr>';
    html += "<th>Seed</th><th>Team</th>";
    roundCols.forEach((r) => (html += `<th>${r}</th>`));
    html += "</tr></thead><tbody>";

    regionTeams.forEach((team) => {
      const adv = snap.advancement[team.tid] || {};
      const elim = team.eliminated ? " mm-eliminated" : "";
      const brand = state.branding[team.tid];
      const logo = brand && brand.logo_url
        ? `<img src="${brand.logo_url}" class="mm-team-logo" alt="" onerror="this.style.display='none'">`
        : "";

      html += `<tr class="mm-bracket-row${elim}" data-tid="${team.tid}">`;
      html += `<td class="mm-seed">${team.seed_num}</td>`;
      html += `<td class="mm-team-cell">${logo}<span class="mm-team-name">${team.name}</span></td>`;

      roundKeys.forEach((rk) => {
        const val = adv[rk] || 0;
        const bg = probColor(val);
        html += `<td class="mm-prob-cell" style="background:${bg}">${val > 0 ? fmtPct(val) : "—"}</td>`;
      });

      html += "</tr>";
    });

    html += "</tbody></table>";

    // R1 matchups
    html += '<div class="mm-matchups"><h3>First Round Matchups</h3><div class="mm-matchups-grid">';
    const r1Slots = Object.entries(snap.bracket)
      .filter(([slot]) => slot.startsWith("R1" + regionCode))
      .sort(([a], [b]) => a.localeCompare(b));

    r1Slots.forEach(([slot, game]) => {
      if (!game.team_a) return;
      const pA = game.p_a_wins;
      const pB = 1 - pA;
      const result = game.result;
      const brandA = state.branding[String(game.team_a.id)];
      const brandB = state.branding[String(game.team_b.id)];
      const colorA = brandA && brandA.primary_color ? brandA.primary_color : "#666";
      const colorB = brandB && brandB.primary_color ? brandB.primary_color : "#666";

      const hasResult = result && result.winner;
      const aIsWinner = hasResult && result.winner === game.team_a.id;
      const bIsWinner = hasResult && result.winner === game.team_b.id;
      let scoreStr = "";
      if (hasResult && result.winner_score != null) {
        scoreStr = `${result.winner_score}–${result.loser_score}`;
      }

      const elimA = hasResult && !aIsWinner ? " mm-matchup-loser" : "";
      const elimB = hasResult && !bIsWinner ? " mm-matchup-loser" : "";

      html += `<div class="mm-matchup${hasResult ? " mm-matchup-decided" : ""}">`;
      html += `<div class="mm-matchup-team${elimA}" style="border-left: 3px solid ${colorA}">`;
      html += `<span class="mm-matchup-seed">${game.team_a.seed_num}</span>`;
      html += `<span class="mm-matchup-name">${game.team_a.name}</span>`;
      html += `<span class="mm-matchup-prob">${fmtPct(pA)}</span>`;
      html += `</div>`;
      html += `<div class="mm-prob-bar"><div class="mm-prob-bar-fill" style="width:${(pA * 100).toFixed(0)}%;background:${colorA}"></div></div>`;
      html += `<div class="mm-matchup-team${elimB}" style="border-left: 3px solid ${colorB}">`;
      html += `<span class="mm-matchup-seed">${game.team_b.seed_num}</span>`;
      html += `<span class="mm-matchup-name">${game.team_b.name}</span>`;
      html += `<span class="mm-matchup-prob">${fmtPct(pB)}</span>`;
      html += `</div>`;
      if (hasResult) {
        const winnerName = aIsWinner ? game.team_a.name : game.team_b.name;
        html += `<span class="mm-result-badge">${winnerName}${scoreStr ? " " + scoreStr : ""}</span>`;
      }
      html += `</div>`;
    });
    html += "</div></div>";

    container.innerHTML = html;

    container.querySelectorAll(".mm-bracket-row").forEach((row) => {
      row.addEventListener("click", () => showTeamDetail(row.dataset.tid));
    });
  }

  function probColor(p) {
    if (p <= 0) return "transparent";
    if (p < 0.1) return `rgba(192, 57, 43, ${0.15 + p * 2})`;
    if (p < 0.3) return `rgba(192, 57, 43, ${0.3 + p})`;
    if (p < 0.6) return `rgba(192, 57, 43, ${0.4 + p * 0.5})`;
    if (p < 0.9) return `rgba(231, 76, 60, ${0.5 + p * 0.3})`;
    return `rgba(245, 176, 65, ${0.6 + p * 0.3})`;
  }

  // ─── Team Deep Dive ───────────────────────────────────────────────

  function showTeamDetail(tid) {
    const snap = state.snapshot;
    const team = snap.teams[tid];
    if (!team) return;

    const section = document.getElementById("section-team-detail");
    section.style.display = "block";
    section.scrollIntoView({ behavior: "smooth", block: "start" });

    const brand = state.branding[tid];
    const logo = brand && brand.logo_url
      ? `<img src="${brand.logo_url}" class="mm-detail-logo" alt="${team.name}" onerror="this.style.display='none'">`
      : "";
    const color = brand && brand.primary_color ? brand.primary_color : "#f0a500";

    document.getElementById("team-detail-title").textContent = team.name;

    // Build strength description based on model type
    let strengthLine;
    if (team.off_mean !== undefined) {
      strengthLine = `Off: ${team.off_mean.toFixed(1)} · Def: ${team.def_mean.toFixed(1)} · Overall: ${team.overall_mean.toFixed(1)}`;
    } else {
      strengthLine = `θ = ${team.theta_mean.toFixed(1)} ± ${team.theta_std.toFixed(1)}`;
    }

    let headerHtml = `
      <div class="mm-detail-info">
        ${logo}
        <div>
          <h3 style="color:${color}">${team.name}</h3>
          <p>${team.seed} seed (${REGION_NAMES[team.region] || team.region} region) · ${strengthLine}</p>
          ${team.eliminated ? '<p class="mm-eliminated-badge">Eliminated</p>' : ""}
        </div>
      </div>
    `;
    document.getElementById("team-detail-header").innerHTML = headerHtml;

    // Advancement bar chart
    const adv = snap.advancement[tid];
    if (adv) {
      const rounds = ROUND_NAMES;
      const probs = rounds.map((r) => adv[r] || 0);

      Plotly.newPlot(
        "team-advancement-chart",
        [
          {
            type: "bar",
            x: rounds,
            y: probs,
            marker: { color: color, opacity: 0.85 },
            text: probs.map((p) => fmtPct(p)),
            textposition: "outside",
            textfont: { size: 11, color: "#f4f4f4" },
            hovertemplate: "%{x}: %{y:.1%}<extra></extra>",
          },
        ],
        {
          ...PLOTLY_LAYOUT_BASE,
          height: 300,
          yaxis: { tickformat: ".0%", range: [0, 1.1], gridcolor: "rgba(255,255,255,0.06)" },
          xaxis: { tickangle: -30, tickfont: { size: 11 } },
          margin: { l: 50, r: 20, t: 10, b: 80 },
        },
        PLOTLY_CONFIG
      );
    }

    // Odds over time
    if (state.timeline && state.timeline.teams[tid]) {
      const tl = state.timeline.teams[tid];
      const dates = Object.keys(tl.odds).sort();
      const odds = dates.map((d) => tl.odds[d]);

      Plotly.newPlot(
        "team-timeline-chart",
        [
          {
            type: "scatter",
            mode: "lines+markers",
            x: dates,
            y: odds,
            line: { color: color, width: 2.5 },
            marker: { size: 6, color: color },
            hovertemplate: "%{x|%b %d}: %{y:.1%}<extra></extra>",
          },
        ],
        {
          ...PLOTLY_LAYOUT_BASE,
          height: 250,
          yaxis: {
            tickformat: ".1%",
            title: { text: "Championship Odds", font: { size: 11 } },
            gridcolor: "rgba(255,255,255,0.06)",
          },
          xaxis: {
            type: "date",
            tickformat: "%b %d",
            tickfont: { size: 10 },
          },
          margin: { l: 60, r: 20, t: 10, b: 50 },
        },
        PLOTLY_CONFIG
      );
      document.getElementById("team-timeline-chart").style.display = "block";
    } else {
      document.getElementById("team-timeline-chart").style.display = "none";
    }
  }

  function hideTeamDetail() {
    document.getElementById("section-team-detail").style.display = "none";
  }

  // ─── Predictions vs Reality ───────────────────────────────────────

  function renderPredictions() {
    const snap = state.snapshot;
    if (!snap) return;

    const container = document.getElementById("predictions-content");
    const results = snap.actual_results || {};
    const played = Object.entries(results).filter(([, r]) => r && r.winner);

    if (played.length === 0) {
      container.innerHTML =
        '<p class="mm-no-data">No tournament games played yet. Check back after the first round!</p>';
      return;
    }

    let correct = 0;
    let total = 0;
    let surprises = [];

    played.forEach(([slot, result]) => {
      const game = snap.bracket[slot];
      if (!game || !game.team_a) return;

      total++;
      const pWinner =
        result.winner === game.team_a.id ? game.p_a_wins : 1 - game.p_a_wins;
      if (pWinner >= 0.5) correct++;

      const winnerName =
        result.winner === game.team_a.id ? game.team_a.name : game.team_b.name;
      const loserName =
        result.winner === game.team_a.id ? game.team_b.name : game.team_a.name;

      if (pWinner < 0.4) {
        const score = result.winner_score != null ? `${result.winner_score}–${result.loser_score}` : "";
        surprises.push({ slot, winner: winnerName, loser: loserName, pWinner, score });
      }
    });

    let html = `
      <div class="mm-accuracy">
        <div class="mm-accuracy-stat">
          <span class="mm-stat-num">${correct}/${total}</span>
          <span class="mm-stat-label">correct predictions (${fmtPct(total > 0 ? correct / total : 0)})</span>
        </div>
      </div>
    `;

    if (surprises.length > 0) {
      html += '<h3>Biggest Surprises</h3><div class="mm-surprises">';
      surprises
        .sort((a, b) => a.pWinner - b.pWinner)
        .forEach((s) => {
          html += `<div class="mm-surprise">
            <span class="mm-surprise-prob">${fmtPct(s.pWinner)}</span>
            <span>${s.winner} over ${s.loser}${s.score ? " (" + s.score + ")" : ""}</span>
          </div>`;
        });
      html += "</div>";
    }

    container.innerHTML = html;
  }

  // ─── Utilities ────────────────────────────────────────────────────

  function formatDate(dateStr) {
    const [y, m, d] = dateStr.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  }
})();
