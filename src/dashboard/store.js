// Browser-only storage. There is no server yet, so everything is kept in localStorage per user.
// When a backend exists, keep these function names and swap the bodies for API calls.

const USER_KEY = "lusion-user";
const logKey = (email) => `lusion-log:${email}`;

const safeParse = (s, fallback) => {
  try {
    return JSON.parse(s) ?? fallback;
  } catch {
    return fallback;
  }
};

// Local date as YYYY-MM-DD (not UTC, so "today" matches the athlete's own calendar)
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function getUser() {
  return safeParse(localStorage.getItem(USER_KEY), null);
}
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function nameFromEmail(email) {
  const part = String(email || "").split("@")[0].replace(/[._-]+/g, " ").trim();
  return part ? part.replace(/\b\w/g, (c) => c.toUpperCase()) : "Athlete";
}

export function loadLog() {
  const u = getUser();
  return u ? safeParse(localStorage.getItem(logKey(u.email)), { sessions: [] }) : { sessions: [] };
}
function saveLog(log) {
  const u = getUser();
  if (!u) return;
  try {
    localStorage.setItem(logKey(u.email), JSON.stringify(log));
  } catch (err) {
    console.error("Could not save training log:", err);
  }
}

// Called when live training actually starts (camera running). This is what adds to the streak.
let current = null;
export function startTraining() {
  if (!getUser()) return null; // not logged in: nothing is saved
  const log = loadLog();
  current = { id: Date.now(), day: dayKey(), start: Date.now(), reps: [] };
  log.sessions.push(current);
  saveLog(log);
  return current.id;
}

// One call per finished rep. weight is in kg.
export function logRep(rep) {
  if (!current) return;
  const log = loadLog();
  const s = log.sessions.find((x) => x.id === current.id);
  if (!s) return;
  s.reps.push({ t: Date.now(), lift: "snatch", ...rep });
  saveLog(log);
}

// ?demo=1 on the dashboard fills in sample data so the layout can be reviewed.
export function seedDemo() {
  setUser({ name: "Alex", email: "demo@lusion.ai", role: "lifter" });
  const sessions = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  for (let w = 25; w >= 0; w--) {
    const days = w === 0 ? [0, 1] : [0, 2, 4].slice(0, 2 + (w % 2));
    for (const off of days) {
      const d = new Date();
      d.setDate(d.getDate() - w * 7 - off);
      const base = 40 + (25 - w) * 2.2;
      const reps = Array.from({ length: 8 + (w % 4) }, (_, i) => ({
        t: d.getTime() + i * 60000,
        lift: "snatch",
        weight: Math.round((base + rnd(-4, 6)) * 2) / 2,
        peakVelocity: +rnd(0.6, 1.1).toFixed(2),
        passed: 3 + Math.round(rnd(0, 2)),
        total: 5,
        rom: { shoulder: rnd(158, 176), hip: rnd(112, 124), knee: rnd(122, 136), ankle: rnd(18, 28) },
      }));
      sessions.push({ id: d.getTime(), day: dayKey(d), start: d.getTime(), reps });
    }
  }
  localStorage.setItem(logKey("demo@lusion.ai"), JSON.stringify({ sessions }));
}

// Runs when this file loads, which is before the navbar reads the user. Dashboard only.
if (location.pathname.endsWith("/lifter.html") && new URLSearchParams(location.search).has("demo")) seedDemo();