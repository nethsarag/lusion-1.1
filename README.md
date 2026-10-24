# Lusion 1.1 (MVP)

A browser-based weightlifting form coach. Point your webcam at yourself, lift, and get instant feedback on your technique after every rep, with no backend, no account and no video upload.

This MVP focuses on the **snatch**. It tracks your body with [MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker), detects each rep automatically, and scores it against five form checks.

> **Status:** early MVP. The thresholds are starting guesses and should be tuned with real reps and a coach (see [Tuning](#tuning-the-rules)).

## Features

- Live skeleton overlay on the webcam feed
- Pre-lift setup checklist: full body in frame, correct distance, standing sideways to the camera
- Automatic rep detection through the phases **Setup → Pull → Catch & stand**
- A results card after every rep with a score, per-check values and up to two coaching cues
- Session history (rep-by-rep scores) shown under the camera
- Everything runs locally in your browser; video never leaves your device

## How a rep is scored

Each completed rep is checked against five rules:

| Check | What it looks at | Cue when it fails |
| --- | --- | --- |
| Setup position | Back angle from vertical at the start | "Chest higher at the start." |
| Extension | Peak hip and knee angle at the top of the pull | "Finish the extension before pulling under." |
| Bar close to body | Horizontal wrist-to-ankle drift, in torso lengths | "Keep the bar close to your body." |
| Catch depth | Hip height relative to the knee in the catch | "Sit deeper in the catch." |
| Lockout | Elbow angle overhead | "Lock your elbows overhead." |

The bar itself is not tracked. The wrists stand in for the bar position.

## Getting started

### Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- A webcam
- A modern browser with WebGL/GPU support (Chrome or Edge recommended)
- An internet connection on first load, because the MediaPipe WASM files are fetched from the jsDelivr CDN

### Install and run

```bash
git clone https://github.com/nethsarag/<your-repo-name>.git
cd <your-repo-name>
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`), click **Start camera** and allow camera access.

### Other scripts

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

## Filming tips

- Stand **sideways** to the camera so the side of your body is visible
- Keep your **whole body in frame**, head to feet, about **2 to 3 m** away
- Use even lighting and a plain background if you can
- Wear fitted clothing so joints are easy to see
- Keep the camera still, at about hip height

The checklist under the video ticks off as each condition is met.

## Project structure

```
├── index.html                    # Page layout and styles
├── public/
│   └── pose_landmarker_full.task # MediaPipe pose model (loaded locally)
└── src/
    ├── main.js                   # Camera, model setup, per-frame loop
    ├── smoothing.js              # Exponential smoothing of landmarks
    ├── metrics.js                # Joint angles and body measurements
    ├── reps.js                   # Rep state machine (setup / pull / catch)
    ├── rules.js                  # Form checks, thresholds and coaching cues
    ├── guide.js                  # Setup checklist and phase indicators
    └── results.js                # Post-rep results card and session history
```

### How it works

1. `main.js` loads the pose model, opens the webcam and runs detection on every new video frame.
2. `smoothing.js` smooths the 33 landmarks to reduce jitter.
3. `metrics.js` converts landmarks to pixel space and computes knee, hip, elbow and back angles on whichever side of the body is more visible.
4. `reps.js` follows the lift through its phases and records peak values for the rep.
5. `rules.js` evaluates the finished rep and picks the top cues.
6. `results.js` shows the results card and pauses detection until you press **Next rep** (or Enter / Space).

## Tuning the rules

All thresholds live in `CONFIG` at the top of `src/rules.js`:

```js
export const CONFIG = {
  setupBackMax: 60,   // deg from vertical at setup
  extensionMin: 165,  // hip and knee angle at the top of the pull
  driftMax: 0.35,     // wrist-to-ankle x distance, in torso lengths
  catchDepthMin: 0,   // hip at or below knee height
  lockoutMin: 165,    // elbow angle overhead
};
```

These are starting guesses. Record some reps, compare the numbers with what a coach sees, and adjust.

## Limitations

- Single person, single camera, side-on view only
- Currently supports the snatch only
- 2D pose estimation, so depth and bar path are approximations
- Accuracy depends on lighting, clothing, camera angle and framing
- Not a replacement for a qualified coach. Treat the feedback as guidance, not medical or safety advice

## Roadmap

- Clean & jerk support
- Session saving and comparison with previous sessions
- Lusion AI chat for talking through your session insights
- Accounts, coach and member dashboards

## Built with

- [Vite](https://vite.dev/)
- [MediaPipe Tasks Vision](https://www.npmjs.com/package/@mediapipe/tasks-vision)
- Vanilla JavaScript

## Contributing

Issues and pull requests are welcome. If you have lifting or coaching experience, feedback on the form rules and thresholds is especially valuable.
