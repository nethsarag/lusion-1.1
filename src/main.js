import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { LandmarkSmoother } from "./smoothing.js";
import { extractMetrics } from "./metrics.js";
import { RepDetector } from "./reps.js";
import { evaluateRep } from "./rules.js";
import { updateGuide, setPhase, noPerson } from "./guide.js";
import { initResults, showResults, isResultsOpen } from "./results.js";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start");
const stateEl = document.getElementById("state");

let landmarker = null;
let lastVideoTime = -1;
let started = false;
let repCount = 0;

const smoother = new LandmarkSmoother(0.4);

const detector = new RepDetector({
  onState: (s) => {
    stateEl.textContent = "Phase: " + s;
    setPhase(s);
  },
  onRep: (rep) => {
    repCount++;
    showResults(repCount, rep, evaluateRep(rep)); // detection pauses until "Next rep"
  },
});

// When the lifter dismisses the results page, start fresh for the next rep
initResults(() => {
  detector.rep = null;
  detector.setState("WAIT_SETUP");
  setPhase("WAIT_SETUP");
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
  await new Promise((resolve) => (video.onloadedmetadata = resolve));
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

// called once per frame with the 33 smoothed landmarks (normalized 0..1)
function handleFrame(lm, t) {
  const m = extractMetrics(lm, canvas.width, canvas.height);
  statusEl.textContent =
    `Knee: ${m.kneeAngle.toFixed(0)}°  Hip: ${m.hipAngle.toFixed(0)}°  Elbow: ${m.elbowAngle.toFixed(0)}°`;
  detector.update(m, t);
  updateGuide(lm, m, canvas.width);
}

function loop() {
  requestAnimationFrame(loop); // schedule next frame first, so one bad frame can't stop the loop

  if (!landmarker || video.readyState < 2) return; // model or camera not ready yet
  if (video.currentTime === lastVideoTime) return; // no new camera frame
  lastVideoTime = video.currentTime;

  const result = landmarker.detectForVideo(video, performance.now());

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (result.landmarks[0]) {
    const lm = smoother.update(result.landmarks[0]);
    const drawing = new DrawingUtils(ctx);
    drawing.drawLandmarks(lm, { radius: 3, color: "#ffd400" });
    drawing.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, {
      color: "#00e5ff",
      lineWidth: 3,
    });
    if (isResultsOpen()) return; // paused while the results page is showing
    try {
      handleFrame(lm, performance.now());
    } catch (err) {
      console.error("handleFrame error:", err);
    }
  } else {
    smoother.prev = null; // forget old positions when the person leaves the frame
    noPerson();
  }
}

startBtn.addEventListener("click", async () => {
  if (started) return; // ignore double clicks
  started = true;
  startBtn.disabled = true;
  statusEl.textContent = "Loading model...";
  try {
    await initLandmarker();
    await startCamera();
    setPhase("WAIT_SETUP");
    statusEl.textContent = "Running. Stand sideways so your full body is visible.";
    loop();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error: " + err.message;
    startBtn.disabled = false;
    started = false;
  }
});