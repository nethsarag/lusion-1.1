import { LandmarkSmoother } from "./smoothing.js";
import { extractMetrics } from "./metrics.js";
import { RepDetector } from "./reps.js";
import { evaluateRep } from "./rules.js";
import { updateGuide, setPhase, noPerson } from "./guide.js";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start");

let landmarker;
let lastVideoTime = -1;

const smoother = new LandmarkSmoother(0.4);
const stateEl = document.getElementById("state");
const feedbackEl = document.getElementById("feedback");
let repCount = 0;

const detector = new RepDetector({
  onState: (s) => {
  stateEl.textContent = "Phase: " + s;
  setPhase(s);
},
  onRep: (rep) => {
    repCount++;
    const { checks, topCues } = evaluateRep(rep);
    feedbackEl.innerHTML =
      `<h3>Rep ${repCount}</h3>` +
      checks.map((c) => `${c.pass ? "✅" : "❌"} ${c.id}: ${c.value}`).join("<br>") +
      `<p><b>${topCues.length ? topCues.join(" ") : "Clean rep!"}</b></p>`;
  },
});

async function initLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );
  landmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/pose_landmarker_full.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720, frameRate: { ideal: 30 } },
    audio: false,
  });
  video.srcObject = stream;
  await new Promise((r) => (video.onloadedmetadata = r));
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

// angle at b formed by a-b-c, in degrees
function angle(a, b, c) {
  const ab = [a.x - b.x, a.y - b.y];
  const cb = [c.x - b.x, c.y - b.y];
  const dot = ab[0] * cb[0] + ab[1] * cb[1];
  const mag = Math.hypot(...ab) * Math.hypot(...cb);
  return (Math.acos(dot / mag) * 180) / Math.PI;
}

// called once per frame with the 33 landmarks (normalized 0..1)
function handleFrame(lm, t) {
  const m = extractMetrics(lm, canvas.width, canvas.height);
  statusEl.textContent = `Knee: ${m.kneeAngle.toFixed(0)}°  Hip: ${m.hipAngle.toFixed(0)}°  Elbow: ${m.elbowAngle.toFixed(0)}°`;
  detector.update(m, t);
  updateGuide(lm, m, canvas.width); // new
}

function loop() {
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const result = landmarker.detectForVideo(video, performance.now());

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drawing = new DrawingUtils(ctx);
  if (result.landmarks[0]) {
  const lm = smoother.update(result.landmarks[0]);
  drawing.drawLandmarks(lm, { radius: 3, color: "#ffd400" });
  drawing.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
    color: "#00e5ff",
    lineWidth: 3,
  });
  handleFrame(lm, performance.now());
}
} else {
  noPerson();
}
  }
  requestAnimationFrame(loop);

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  statusEl.textContent = "Loading model...";
  try {
    await initLandmarker();
    await startCamera();
    statusEl.textContent = "Running. Stand sideways so your full body is visible.";
    loop();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error: " + err.message;
    startBtn.disabled = false;
  }
});