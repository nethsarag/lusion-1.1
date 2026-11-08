// Everything tunable about the dashboard lives here. Starting guesses: tune with a coach.

// ---- Joint range of motion (deepest phase of the lift) ------------------------------
// Zones are read left to right along each bar: [from, to, zone].
// zone: "good" | "warn" | "danger". Values are degrees.
export const ROM = {
  shoulder: {
    title: "Shoulder Flexion",
    sub: "Hip - Shoulder - Elbow",
    min: 0, max: 180,
    zones: [[0, 150, "danger"], [150, 160, "warn"], [160, 180, "good"]],
    risk: "Incomplete overhead: risks lumbar hyperextension and rotator cuff impingement.",
  },
  hip: {
    title: "Hip Flexion",
    sub: "Shoulder - Hip - Knee (Stand=0°)",
    min: 0, max: 150,
    zones: [[0, 110, "warn"], [110, 125, "good"], [125, 130, "warn"], [130, 150, "danger"]],
    risk: "Forced deep flexion: \"butt wink\" (pelvic tilt) can load the lumbar discs.",
    warn: "Below target depth. Work on hip mobility.",
  },
  knee: {
    title: "Knee Flexion",
    sub: "Hip - Knee - Ankle (Stand=0°)",
    min: 0, max: 180,
    zones: [[0, 120, "warn"], [120, 140, "good"], [140, 180, "danger"]],
    risk: "Past 140°: meniscus and patellar tendon overload. Watch for the knees caving in.",
    warn: "Below target depth. Sit deeper in the catch.",
  },
  ankle: {
    title: "Ankle Dorsiflexion",
    sub: "Offset from standing (90°)",
    min: -10, max: 40,
    zones: [[-10, 15, "danger"], [15, 20, "warn"], [20, 40, "good"]],
    risk: "Under 15°: knee collapse, heel lift and excess forward lean can strain the lower back.",
    warn: "Slightly limited. Ankle mobility work will help.",
  },
};
export const ROM_ORDER = ["shoulder", "hip", "knee", "ankle"];

// ---- Muscle groups for volume load --------------------------------------------------
// Share of each rep's volume credited to each group, per lift. Only the snatch exists today,
// so the split is the same for every rep until more lifts are added.
export const MUSCLE_GROUPS = [
  { id: "all", label: "All muscles" },
  { id: "quads", label: "Quads" },
  { id: "posterior", label: "Glutes & hamstrings" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
];
export const MUSCLE_SPLIT = {
  snatch: { quads: 0.3, posterior: 0.3, back: 0.2, shoulders: 0.2 },
};

// ---- Bar speed ----------------------------------------------------------------------
// The camera has no real-world scale, so the shoulder-to-hip length stands in as a ruler.
export const TORSO_METERS = 0.5; // typical adult. A wrong guess scales every speed by the same factor.
export const MAX_PLAUSIBLE_SPEED = 4; // m/s, anything above is tracking noise

// ---- Overall status -----------------------------------------------------------------
export const STATUS = {
  weights: { form: 0.35, rom: 0.3, consistency: 0.2, load: 0.15 },
  targetDaysPerWeek: 4,
  dangerCap: 69, // any joint in a danger zone keeps the status below "Good"
  bands: [
    { min: 85, label: "Great!", message: "Hey! You are crushing it." },
    { min: 70, label: "Good!", message: "Hey! You are doing great." },
    { min: 50, label: "Fair", message: "Room to improve. Check your joint ranges." },
    { min: 0, label: "Low", message: "Focus on clean form before adding load." },
  ],
};

export const ANNOUNCEMENTS = [
  { id: "a1", title: "Welcome to Lusion", body: "Start a live training session to build your streak." },
  { id: "a2", title: "Snatch is live", body: "Clean & Jerk support is coming soon." },
];