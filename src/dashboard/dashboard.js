import "../styles/dashboard.css";
import { ROM, ROM_ORDER, MUSCLE_GROUPS } from "./config.js";
import { getUser, loadLog } from "./store.js";
import {
  computeStreak,
  latestPeakVelocity,
  weeklyVolume,
  latestRom,
  overallStatus,
} from "./analytics.js";

const $ = (id) => document.getElementById(id);
const DASHBOARDS = { lifter: "/lifter.html", coach: "/coach.html", admin: "/admin.html" };

// ---- Who is looking at this page ----------------------------------------------------
const user = getUser();
if (!user) {
  location.replace("/login.html");
} else if (user.role !== "lifter") {
  location.replace(DASHBOARDS[user.role] || "/login.html");
}

let group = "all";

// ---- Greeting and the three number cards --------------------------------------------
function renderStats(log) {
  $("dash-name").textContent = user.name || "Athlete";

  const streak = computeStreak(log);
  $("stat-streak").textContent = String(streak).padStart(2, "0");
  $("stat-streak-unit").textContent = streak === 1 ? "Day" : "Days";

  const v = latestPeakVelocity(log);
  $("stat-velocity").textContent = v == null ? "--" : v.toFixed(1);

  const s = overallStatus(log);
  $("stat-status").textContent = s.label;
  $("stat-status-msg").textContent = s.message;
  $("stat-status").parentElement.title =
    s.score == null ? "" : `Score ${s.score}/100 (form, joint range, consistency, load)`;
}

// ---- Joint range of motion cards ----------------------------------------------------
const ZONE_TEXT = { good: "Good range", warn: "Watch", danger: "Danger zone" };

function romCard(joint, data) {
  const cfg = ROM[joint];
  const span = cfg.max - cfg.min;
  const segs = cfg.zones
    .map(([a, b, z]) => `<span class="rom-seg" data-zone="${z}" style="width:${((b - a) / span) * 100}%"></span>`)
    .join("");

  const card = document.createElement("article");
  card.className = "dash-card rom-card" + (data ? " has-data" : "");
  if (data) card.dataset.zone = data.zone;

  const pos = data ? Math.min(100, Math.max(0, ((data.value - cfg.min) / span) * 100)) : 0;
  const status = data
    ? `${ZONE_TEXT[data.zone]}${data.dangerReps ? ` · ${data.dangerReps}/${data.reps} reps` : ""}`
    : "Waiting for data...";
  const note = !data ? "" : data.zone === "danger" ? cfg.risk : data.zone === "warn" ? cfg.warn || "" : "";

  card.innerHTML = `
    <div class="rom-head">
      <div>
        <h3 class="rom-title">${cfg.title}</h3>
        <p class="rom-sub">${cfg.sub}</p>
      </div>
      <div class="rom-value" aria-label="${data ? `${Math.round(data.value)} degrees` : "no data"}">
        <span>${data ? Math.round(data.value) + "°" : "-- °"}</span><span class="rom-dot"></span>
      </div>
    </div>
    <div class="rom-bar" role="img" aria-label="${cfg.title} range from ${cfg.min} to ${cfg.max} degrees">
      ${segs}
      <i class="rom-marker" style="left:${pos}%" ${data ? "" : "hidden"}></i>
    </div>
    <div class="rom-scale"><span>${cfg.min}°</span><span class="rom-status">${status}</span><span>${cfg.max}°</span></div>
    ${note ? `<p class="rom-risk">${note}</p>` : ""}`;
  return card;
}

function renderRom(log) {
  const rom = latestRom(log);
  $("rom-panel").replaceChildren(...ROM_ORDER.map((j) => romCard(j, rom?.[j])));
}

// ---- Weekly volume load chart -------------------------------------------------------
const W = 640, H = 210, PAD_X = 14, TOP = 16, BASE = H - 8;
const fmtKg = (n) => Math.round(n).toLocaleString("en-US") + " kg";
const fmtWeek = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// smooth line through the points (Catmull-Rom converted to Bezier curves)
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function renderChart(log) {
  const weeks = weeklyVolume(log, group);
  const max = Math.max(...weeks.map((w) => w.volume), 0);
  const n = weeks.length;
  const slot = (W - PAD_X * 2) / n;
  const barW = slot * 0.62;
  const h = (v) => (max ? Math.max(3, (v / max) * (BASE - TOP)) : 3);

  const bars = weeks
    .map((w, i) => {
      const x = PAD_X + i * slot + (slot - barW) / 2;
      const bh = h(w.volume);
      return `
        <line class="grid-line" x1="${x + barW / 2}" x2="${x + barW / 2}" y1="${TOP}" y2="${BASE}"/>
        <g class="bar" data-i="${i}">
          <rect x="${x}" y="${BASE - bh}" width="${barW}" height="${bh}" rx="${Math.min(6, barW / 2)}" fill="url(#bar-fill)"/>
          <rect class="bar-hit" x="${PAD_X + i * slot}" y="0" width="${slot}" height="${H}"/>
        </g>`;
    })
    .join("");

  // trend line: 3 week moving average, drawn only where there is training
  const pts = weeks.map((w, i) => {
    const win = weeks.slice(Math.max(0, i - 1), i + 2);
    const avg = win.reduce((s, x) => s + x.volume, 0) / win.length;
    return [PAD_X + i * slot + slot / 2, BASE - (max ? (avg / max) * (BASE - TOP) : 0)];
  });
  const first = weeks.findIndex((w) => w.volume > 0);

  $("chart-body").innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly volume load for the last ${n} weeks">
      <defs>
        <linearGradient id="bar-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd600"/><stop offset="1" stop-color="#7d7d78"/>
        </linearGradient>
      </defs>
      ${bars}
      <line class="axis" x1="${PAD_X}" x2="${W - PAD_X}" y1="${BASE}" y2="${BASE}"/>
      ${first >= 0 ? `<path class="trend" d="${smoothPath(pts.slice(first))}"/>` : ""}
    </svg>
    <div class="dash-tip" id="chart-tip" hidden></div>
    ${max ? "" : `<div class="dash-empty"><span class="rom-status">Waiting for data...</span></div>`}`;

  const cur = weeks[n - 1];
  $("chart-total").textContent = cur.volume ? `This week: ${fmtKg(cur.volume)}` : "";

  // hover tooltip
  const body = $("chart-body"), tip = $("chart-tip");
  body.querySelectorAll(".bar").forEach((g) => {
    const w = weeks[+g.dataset.i];
    g.addEventListener("pointerenter", () => {
      g.classList.add("is-hover");
      body.classList.add("has-hover");
      tip.hidden = false;
      tip.innerHTML = `<strong>Week of ${fmtWeek(w.start)}</strong><br>${fmtKg(w.volume)} · ${w.sets} sets · ${w.reps} reps`;
      const r = g.querySelector("rect").getBoundingClientRect(), b = body.getBoundingClientRect();
      tip.style.left = Math.min(Math.max(r.left - b.left + r.width / 2, 80), b.width - 80) + "px";
      tip.style.top = r.top - b.top - 6 + "px";
    });
    g.addEventListener("pointerleave", () => {
      g.classList.remove("is-hover");
      body.classList.remove("has-hover");
      tip.hidden = true;
    });
  });
}

function setupGroupSelect(log) {
  const sel = $("chart-group");
  sel.innerHTML = MUSCLE_GROUPS.map((g) => `<option value="${g.id}">${g.label}</option>`).join("");
  sel.value = group;
  sel.addEventListener("change", () => {
    group = sel.value;
    renderChart(loadLog());
  });
}

// ---- Go -----------------------------------------------------------------------------
function render() {
  const log = loadLog();
  renderStats(log);
  renderRom(log);
  renderChart(log);
}

if (user && user.role === "lifter") {
  setupGroupSelect();
  render();
  // Training in another tab, or coming back with the back button: refresh the numbers
  window.addEventListener("storage", render);
  window.addEventListener("pageshow", (e) => e.persisted && render());
}