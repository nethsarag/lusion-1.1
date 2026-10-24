// Starting guesses only. Tune them with recorded reps and a coach.
export const CONFIG = {
  setupBackMax: 60, // deg from vertical at setup
  extensionMin: 165, // hip and knee angle at the top of the pull
  driftMax: 0.35, // wrist-to-ankle x distance, in torso lengths
  catchDepthMin: 0, // hip at or below knee height
  lockoutMin: 165, // elbow angle overhead
};

export function evaluateRep(r) {
  const checks = [
    {
      id: "setup",
      pass: r.setupBack <= CONFIG.setupBackMax,
      value: `${r.setupBack.toFixed(0)}°`,
      cue: "Chest higher at the start.",
    },
    {
      id: "extension",
      pass: r.peakHip >= CONFIG.extensionMin && r.peakKnee >= CONFIG.extensionMin,
      value: `hip ${r.peakHip.toFixed(0)}°, knee ${r.peakKnee.toFixed(0)}°`,
      cue: "Finish the extension before pulling under.",
    },
    {
      id: "bar-close",
      pass: r.drift <= CONFIG.driftMax,
      value: r.drift.toFixed(2),
      cue: "Keep the bar close to your body.",
    },
    {
      id: "depth",
      pass: r.catchDepth >= CONFIG.catchDepthMin,
      value: r.catchDepth.toFixed(2),
      cue: "Sit deeper in the catch.",
    },
    {
      id: "lockout",
      pass: r.lockoutElbow >= CONFIG.lockoutMin,
      value: `${r.lockoutElbow.toFixed(0)}°`,
      cue: "Lock your elbows overhead.",
    },
  ];
  return { checks, topCues: checks.filter((c) => !c.pass).slice(0, 2).map((c) => c.cue) };
}