// Pure functions: log in, numbers out. No DOM, so they are easy to test.
import { ROM, ROM_ORDER, MUSCLE_SPLIT, STATUS } from "./config.js";
import { dayKey } from "./store.js";

const DAY = 86400000;
const allReps = (log) => log.sessions.flatMap((s) => s.reps);

// ---- Streak -------------------------------------------------------------------------
// Consecutive calendar days with a live training session, ending today. If today has no
// session yet, the streak is still alive (it only breaks once a whole day is missed).
export function computeStreak(log, now = new Date()) {
  const days = new Set(log.sessions.map((s) => s.day));
  const d = new Date(now);
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ---- Peak velocity ------------------------------------------------------------------
// Highest single-rep bar speed (m/s) in the most recent session that has any.
export function latestPeakVelocity(log) {
  for (let i = log.sessions.length - 1; i >= 0; i--) {
    const v = log.sessions[i].reps.map((r) => r.peakVelocity).filter((x) => x > 0);
    if (v.length) return Math.max(...v);
  }
  return null;
}

// ---- Volume load --------------------------------------------------------------------
// Sets x reps x weight. Summing weight over every rep gives the same number, so reps are
// logged one by one and sets are only counted (a new set starts when the weight changes
// or there is a 3 minute rest).
export function countSets(reps) {
  let sets = 0, prev = null;
  for (const r of [...reps].sort((a, b) => a.t - b.t)) {
    if (!prev || r.weight !== prev.weight || r.t - prev.t > 180000) sets++;
    prev = r;
  }
  return sets;
}

export function repVolume(rep, group = "all") {
  const w = rep.weight || 0;
  if (group === "all") return w;
  return w * (MUSCLE_SPLIT[rep.lift]?.[group] ?? 0);
}

export function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
}

// One entry per calendar week (Mon to Sun), oldest first, ending with the current week.
export function weeklyVolume(log, group = "all", weeks = 26, now = new Date()) {
  const start = weekStart(now);
  const out = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() - (weeks - 1 - i) * 7);
    return { start: d, volume: 0, reps: 0, repList: [] };
  });
  for (const r of allReps(log)) {
    const weeksAgo = Math.round((start - weekStart(r.t)) / (7 * DAY)); // round: DST makes a week 167 or 169 h
    const wk = out[out.length - 1 - weeksAgo];
    if (!wk) continue;
    wk.volume += repVolume(r, group);
    wk.reps++;
    wk.repList.push(r);
  }
  out.forEach((w) => ((w.sets = countSets(w.repList)), delete w.repList));
  return out;
}

// ---- Joint range of motion ----------------------------------------------------------
export function romZone(joint, value) {
  const z = ROM[joint].zones.find(([a, b]) => value >= a && value < b);
  return z ? z[2] : value < ROM[joint].min ? ROM[joint].zones[0][2] : ROM[joint].zones.at(-1)[2];
}

// Average deepest-phase angle per joint over the latest session that has ROM data.
export function latestRom(log) {
  for (let i = log.sessions.length - 1; i >= 0; i--) {
    const reps = log.sessions[i].reps.filter((r) => r.rom);
    if (!reps.length) continue;
    const out = {};
    for (const j of ROM_ORDER) {
      const vals = reps.map((r) => r.rom[j]).filter((v) => Number.isFinite(v));
      if (!vals.length) continue;
      const value = vals.reduce((a, b) => a + b, 0) / vals.length;
      out[j] = {
        value,
        zone: romZone(j, value),
        dangerReps: vals.filter((v) => romZone(j, v) === "danger").length,
        reps: vals.length,
      };
    }
    return out;
  }
  return null;
}

// ---- Overall status -----------------------------------------------------------------
// 0-100 from four parts (weights in config.js):
//   form         share of form checks passed over the last 7 days (else the latest session)
//   rom          joints in range at the deepest phase: good 1, warn 0.5, danger 0
//   consistency  training days in the last 7, against the weekly target
//   load         volume of the last 7 days vs the 7 before: a rise of up to 20% is ideal
// A part with no data is left out and the others are re-weighted. Any joint in a danger zone
// caps the result below "Good", because safety outranks everything else.
export function overallStatus(log, now = new Date()) {
  const reps = allReps(log);
  if (!reps.length) return { score: null, label: "--", message: "Finish a live session to see your status." };

  const t = now.getTime();
  const recent = reps.filter((r) => t - r.t <= 7 * DAY);
  const formReps = recent.length ? recent : log.sessions.findLast((s) => s.reps.length).reps;
  const parts = {};

  const checks = formReps.filter((r) => r.total > 0);
  if (checks.length) parts.form = checks.reduce((s, r) => s + r.passed / r.total, 0) / checks.length;

  const rom = latestRom(log);
  if (rom) {
    const pts = { good: 1, warn: 0.5, danger: 0 };
    const zs = Object.values(rom).map((j) => pts[j.zone]);
    parts.rom = zs.reduce((a, b) => a + b, 0) / zs.length;
  }

  const days = new Set(log.sessions.filter((s) => t - s.start <= 7 * DAY).map((s) => s.day)).size;
  parts.consistency = Math.min(1, days / STATUS.targetDaysPerWeek);

  const sum = (from, to) =>
    reps.filter((r) => t - r.t > from * DAY && t - r.t <= to * DAY).reduce((s, r) => s + (r.weight || 0), 0);
  const thisW = sum(0, 7), lastW = sum(7, 14);
  if (lastW > 0) {
    const ratio = thisW / lastW;
    parts.load = ratio >= 0.9 && ratio <= 1.2 ? 1 : ratio >= 0.7 && ratio <= 1.4 ? 0.6 : 0.3;
  }

  let total = 0, wsum = 0;
  for (const [k, v] of Object.entries(parts)) {
    total += v * STATUS.weights[k];
    wsum += STATUS.weights[k];
  }
  let score = Math.round((total / wsum) * 100);

  const dangerJoint = rom && ROM_ORDER.find((j) => rom[j]?.zone === "danger");
  if (dangerJoint) score = Math.min(score, STATUS.dangerCap);

  const band = STATUS.bands.find((b) => score >= b.min);
  return {
    score,
    label: band.label,
    message: dangerJoint ? `Check your ${ROM[dangerJoint].title.toLowerCase()} range.` : band.message,
    parts,
  };
}