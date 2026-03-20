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

  const KAGGLE_URL = "https://www.kaggle.com/competitions/march-machine-learning-mania-2026/leaderboard";

  // State
  let state = {
    gender: "M",
    date: null,
    snapshot: null,
    branding: null,
    timeline: null,
    kaggle: null,
    marketOdds: null,
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
    await loadKaggle();
    renderKaggleCard();
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
    if (state.date && state.date !== "latest") {
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
        state.marketOdds = null;
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
    // "Latest" option — always first, loads latest.json
    const latestOpt = document.createElement("option");
    latestOpt.value = "latest";
    latestOpt.textContent = "Latest";
    if (state.date === "latest") latestOpt.selected = true;
    sel.appendChild(latestOpt);
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

  async function loadKaggle() {
    try {
      const resp = await fetch(`${DATA_BASE}/kaggle_leaderboard.json`);
      state.kaggle = await resp.json();
    } catch (e) {
      state.kaggle = null;
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
    if (!state.date || (state.date !== "latest" && !state.availableDates.includes(state.date))) {
      state.date = "latest";
    }
    setupDateSelector();
  }

  async function loadSnapshot() {
    showLoading(true);
    const genderDir = state.gender === "M" ? "mens" : "womens";
    try {
      const url = state.date === "latest"
        ? `${DATA_BASE}/${genderDir}/latest.json`
        : `${DATA_BASE}/${genderDir}/snapshots/${state.date}.json`;
      const resp = await fetch(url);
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

    try {
      const resp = await fetch(`${DATA_BASE}/${genderDir}/market_odds.json`);
      if (resp.ok) state.marketOdds = await resp.json();
    } catch (e) {
      state.marketOdds = null;
    }

    await renderAll();
    showLoading(false);
  }

  function showLoading(show) {
    document.getElementById("loading-indicator").style.display = show ? "flex" : "none";
    document.getElementById("dashboard-content").style.display = show ? "none" : "block";
  }

  // ─── Rendering ────────────────────────────────────────────────────

  async function renderAll() {
    renderChampionshipChart();
    renderAdvancementHeatmap();
    renderRegionBracket(getActiveRegion());
    await renderPredictions();
    hideTeamDetail();
  }

  function renderKaggleCard() {
    const card = document.getElementById("kaggle-card");
    const statsEl = document.getElementById("kaggle-stats");
    if (!state.kaggle || !state.kaggle.length) {
      card.style.display = "none";
      return;
    }

    const valid = state.kaggle.filter((e) => e.rank != null);
    const entry = valid.length ? valid[valid.length - 1] : null;

    if (!entry || entry.rank == null) {
      card.style.display = "none";
      return;
    }

    const rankStr = `Rank ${entry.rank.toLocaleString()} / ${entry.total_entries ? entry.total_entries.toLocaleString() : "?"}`;
    const pctStr = entry.total_entries ? ` (Top ${Math.ceil((entry.rank / entry.total_entries) * 100)}%)` : "";
    const scoreStr = entry.score != null ? ` · Brier: ${entry.score.toFixed(4)}` : "";
    statsEl.textContent = rankStr + pctStr + scoreStr;
    card.style.display = "block";
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
            text: val === 1 ? "✓" : fmtPct(val),
            showarrow: false,
            font: {
              size: val === 1 ? 10 : 8,
              color: val === 1 ? "#27ae60" : val > 0.65 ? "#1a1a1a" : "#e0e0e0",
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
        if (val === 1) {
          html += `<td class="mm-prob-cell mm-prob-locked">✓</td>`;
        } else {
          const bg = probColor(val);
          html += `<td class="mm-prob-cell" style="background:${bg}">${val > 0 ? fmtPct(val) : "—"}</td>`;
        }
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
      html += `<span class="mm-matchup-prob">${aIsWinner ? '<span class="mm-prob-check">✓</span>' : hasResult ? "" : fmtPct(pA)}</span>`;
      html += `</div>`;
      html += `<div class="mm-prob-bar"><div class="mm-prob-bar-fill" style="width:${(pA * 100).toFixed(0)}%;background:${colorA}"></div></div>`;
      html += `<div class="mm-matchup-team${elimB}" style="border-left: 3px solid ${colorB}">`;
      html += `<span class="mm-matchup-seed">${game.team_b.seed_num}</span>`;
      html += `<span class="mm-matchup-name">${game.team_b.name}</span>`;
      html += `<span class="mm-matchup-prob">${bIsWinner ? '<span class="mm-prob-check">✓</span>' : hasResult ? "" : fmtPct(pB)}</span>`;
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

  // Historical higher-seed win rates (1985–2024 men's NCAA tournament)
  const HIST_SEED_WIN_RATE = {
    "1_16": 0.99, "2_15": 0.94, "3_14": 0.85, "4_13": 0.79,
    "5_12": 0.64, "6_11": 0.62, "7_10": 0.61, "8_9": 0.51,
  };

  function chalkProb(seedA, seedB) {
    return seedA < seedB ? 1.0 : 0.0;
  }

  function historicalProb(seedA, seedB) {
    const lo = Math.min(seedA, seedB);
    const hi = Math.max(seedA, seedB);
    const key = `${lo}_${hi}`;
    const p = HIST_SEED_WIN_RATE[key];
    if (p == null) return 0.5;
    return seedA < seedB ? p : 1 - p;
  }

  function brier(pWinner) {
    return (1 - pWinner) ** 2;
  }

  async function renderPredictions() {
    const snap = state.snapshot;
    if (!snap) return;

    const container = document.getElementById("predictions-content");
    const results = snap.actual_results || {};
    const played = Object.entries(results).filter(([, r]) => r && r.winner);

    // Load the pre-tournament snapshot for original predictions (before lock-in)
    let preSnap = snap;
    if (state.availableDates.length > 1) {
      const firstDate = state.availableDates[0];
      if (firstDate !== state.date) {
        const genderDir = state.gender === "M" ? "mens" : "womens";
        try {
          const resp = await fetch(`${DATA_BASE}/${genderDir}/snapshots/${firstDate}.json`);
          if (resp.ok) preSnap = await resp.json();
        } catch (e) { /* fall back to current snapshot */ }
      }
    }

    if (played.length === 0) {
      container.innerHTML =
        '<p class="mm-no-data">No tournament games played yet. Check back after the first round!</p>';
      return;
    }

    const marketGames = state.marketOdds ? state.marketOdds.games || {} : {};

    let correct = 0;
    let chalkCorrect = 0;
    let total = 0;
    let brierSum = 0;
    let brierChalk = 0;
    let brierHist = 0;
    let brierMarket = 0;
    let marketTotal = 0;
    let games = [];
    let surprises = [];

    played.forEach(([slot, result]) => {
      const game = snap.bracket[slot];
      if (!game || !game.team_a) return;

      // Skip play-in games (same seed, no meaningful prediction)
      if (game.play_in) return;

      // Use pre-tournament prediction to avoid lock-in bias
      const preGame = preSnap.bracket[slot];
      const pA = preGame ? preGame.p_a_wins : game.p_a_wins;

      total++;
      const aWon = result.winner === game.team_a.id;
      const pWinner = aWon ? pA : 1 - pA;
      if (pWinner >= 0.5) correct++;

      const chalkP = chalkProb(game.team_a.seed_num, game.team_b.seed_num);
      const chalkPWinner = aWon ? chalkP : 1 - chalkP;
      if (chalkPWinner >= 0.5) chalkCorrect++;

      const histP = historicalProb(game.team_a.seed_num, game.team_b.seed_num);
      const histPWinner = aWon ? histP : 1 - histP;

      brierSum += brier(pWinner);
      brierChalk += brier(chalkPWinner);
      brierHist += brier(histPWinner);

      // Market odds (if available for this slot)
      const mkt = marketGames[slot];
      if (mkt) {
        // For R2+ contender slots, market odds store their own team_a_id
        const mktAId = mkt.team_a_id || game.team_a.id;
        const mktAWon = result.winner === mktAId;
        const mktPWinner = mktAWon ? mkt.p_a_wins : 1 - mkt.p_a_wins;
        brierMarket += brier(mktPWinner);
        marketTotal++;
      }

      const winnerName = aWon ? game.team_a.name : game.team_b.name;
      const loserName = aWon ? game.team_b.name : game.team_a.name;
      const winnerSeed = aWon ? game.team_a.seed_num : game.team_b.seed_num;
      const loserSeed = aWon ? game.team_b.seed_num : game.team_a.seed_num;
      const score = result.winner_score != null ? `${result.winner_score}–${result.loser_score}` : "";

      games.push({ slot, winnerName, loserName, winnerSeed, loserSeed, pWinner, score });

      if (pWinner < 0.4) {
        surprises.push({ slot, winner: winnerName, loser: loserName, pWinner, score });
      }
    });

    if (total === 0) {
      const playInCount = played.length;
      const msg = playInCount > 0
        ? "No main-draw games played yet — play-in games are omitted (same-seed matchups). Check back after the first round!"
        : "No tournament games played yet. Check back after the first round!";
      container.innerHTML = `<p class="mm-no-data">${msg}</p>`;
      return;
    }

    const avgBrier = brierSum / total;
    const avgBrierChalk = brierChalk / total;
    const avgBrierHist = brierHist / total;
    const avgBrierMarket = marketTotal > 0 ? brierMarket / marketTotal : null;

    let html = `
      <div class="mm-accuracy">
        <div class="mm-accuracy-stat">
          <span class="mm-stat-num">${correct}/${total}</span>
          <span class="mm-stat-label">correct picks (${fmtPct(correct / total)})</span>
        </div>
      </div>
    `;

    // Brier score comparison
    html += `<h3>Brier Score Comparison <span class="mm-brier-n">(${total} game${total > 1 ? "s" : ""})</span></h3>`;
    html += '<p class="mm-brier-explainer">Lower is better (0 = perfect, 1 = worst).</p>';
    html += '<div class="mm-brier-grid">';

    const brierEntries = [
      { label: "This model", value: avgBrier, highlight: true },
      { label: "Hist. seed avg", value: avgBrierHist, highlight: false },
      { label: "Chalk (always higher seed)", value: avgBrierChalk, highlight: false },
    ];
    if (avgBrierMarket != null) {
      brierEntries.push({ label: "Market (DraftKings)", value: avgBrierMarket, highlight: false });
    }
    brierEntries.sort((a, b) => a.value - b.value);

    brierEntries.forEach((entry, i) => {
      const cls = entry.highlight ? " mm-brier-highlight" : "";
      const rank = i === 0 ? ' <span class="mm-brier-best">best</span>' : "";
      html += `<div class="mm-brier-card${cls}">
        <span class="mm-brier-value">${entry.value.toFixed(3)}</span>
        <span class="mm-brier-label">${entry.label}${rank}</span>
      </div>`;
    });
    html += "</div>";

    // Game-by-game results sorted by surprise factor
    games.sort((a, b) => a.pWinner - b.pWinner);
    html += '<h3>Game Results</h3>';
    html += '<table class="mm-results-table"><thead><tr>';
    html += '<th>Result</th><th>Score</th><th>Model P(winner)</th>';
    html += '</tr></thead><tbody>';
    games.forEach((g) => {
      const rowCls = g.pWinner < 0.5 ? ' class="mm-upset-row"' : "";
      html += `<tr${rowCls}>`;
      html += `<td><span class="mm-result-seed">${g.winnerSeed}</span> ${g.winnerName} over <span class="mm-result-seed">${g.loserSeed}</span> ${g.loserName}</td>`;
      html += `<td class="mm-result-score">${g.score}</td>`;
      html += `<td class="mm-result-prob">${fmtPct(g.pWinner)}</td>`;
      html += `</tr>`;
    });
    html += '</tbody></table>';

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

    html += '<p class="mm-predictions-footnote">(Play-in games omitted)</p>';
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
