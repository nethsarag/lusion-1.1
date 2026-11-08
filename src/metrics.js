const LEFT = { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 };
const RIGHT = { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 };
const FOOT = { left: 31, right: 32 }; // foot index (toe). Kept out of LEFT/RIGHT so a hidden toe never blocks rep detection

export function angle(a, b, c) {
  const ab = [a.x - b.x, a.y - b.y];
  const cb = [c.x - b.x, c.y - b.y];
  const dot = ab[0] * cb[0] + ab[1] * cb[1];
  const mag = Math.hypot(...ab) * Math.hypot(...cb) || 1e-6;
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

export function extractMetrics(lm, w, h) {
  // normalized -> pixels (keeps angles correct on a 16:9 frame)
  const px = lm.map((p) => ({ x: p.x * w, y: p.y * h, visibility: p.visibility ?? 0 }));

  const visSum = (ids) => Object.values(ids).reduce((s, i) => s + px[i].visibility, 0);
  const ids = visSum(LEFT) >= visSum(RIGHT) ? LEFT : RIGHT;

  const p = {};
  for (const [name, i] of Object.entries(ids)) p[name] = px[i];
  const foot = px[ids === LEFT ? FOOT.left : FOOT.right];

  const torso = Math.hypot(p.shoulder.x - p.hip.x, p.shoulder.y - p.hip.y) || 1e-6;
  const minVis = Math.min(...Object.values(p).map((q) => q.visibility));

  return {
    p,
    nose: px[0],
    torso, // used to normalize distances
    minVis,
    kneeAngle: angle(p.hip, p.knee, p.ankle),
    hipAngle: angle(p.shoulder, p.hip, p.knee),
    elbowAngle: angle(p.shoulder, p.elbow, p.wrist),
    // Joint range of motion for the dashboard (see src/dashboard/config.js for the target ranges)
    shoulderFlexion: angle(p.hip, p.shoulder, p.elbow), // 0 = arm down, 180 = arm overhead
    hipFlexion: 180 - angle(p.shoulder, p.hip, p.knee), // 0 = standing
    kneeFlexion: 180 - angle(p.hip, p.knee, p.ankle), // 0 = standing
    ankleDorsi: foot.visibility > 0.5 ? 90 - angle(p.knee, p.ankle, foot) : null, // 0 = standing
    // torso lean from vertical, 0 = upright, 90 = horizontal
    backAngle:
      (Math.atan2(Math.abs(p.shoulder.x - p.hip.x), Math.abs(p.shoulder.y - p.hip.y)) * 180) /
      Math.PI,
  };
}