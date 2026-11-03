const KEY = [0, 11, 12, 23, 24, 25, 26, 27, 28, 31, 32]; // head, shoulders, hips, knees, ankles, feet
const $ = (id) => document.getElementById(id);

let phase = "WAIT_SETUP";

function tick(id, ok) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle("ok", ok);
  const icon = el.querySelector(".icon");
  if (icon) icon.textContent = ok ? "✅" : "⬜";
}

function showTip(text, ready) {
  const tip = $("tip");
  if (!tip) return;
  tip.textContent = text;
  tip.classList.toggle("ready", ready);
}

const PHASE_HINT = {
  WAIT_SETUP: "Ready! Get into your setup position at the bar.",
  READY: "Good setup. Begin your pull.",
  PULL: "Pull!",
  CATCH: "Catch it, then stand up to finish the rep.",
};

export function setPhase(state) {
  phase = state;
  $("step-setup")?.classList.toggle("active", state === "WAIT_SETUP" || state === "READY");
  $("step-pull")?.classList.toggle("active", state === "PULL");
  $("step-catch")?.classList.toggle("active", state === "CATCH");
}

export function updateGuide(lm, m, w) {
  const inFrame = KEY.every(
    (i) =>
      (lm[i].visibility ?? 0) > 0.5 &&
      lm[i].x > 0.02 && lm[i].x < 0.98 &&
      lm[i].y > 0.02 && lm[i].y < 0.98
  );

  const ankleY = (lm[27].y + lm[28].y) / 2;
  const distanceOk = ankleY - lm[0].y > 0.55; // body fills enough of the frame

  const shoulderGap = (Math.abs(lm[11].x - lm[12].x) * w) / m.torso;
  const sideOn = shoulderGap < 0.45; // shoulders overlap when seen from the side

  tick("chk-frame", inFrame);
  tick("chk-dist", distanceOk);
  tick("chk-side", sideOn);

  // Once the lift is underway, only show lift hints (the bar can hide joints)
  if (phase === "PULL" || phase === "CATCH") {
    showTip(PHASE_HINT[phase], true);
    return;
  }

  if (!inFrame) showTip("Step back until your whole body, head to feet, is in frame.", false);
  else if (!distanceOk) showTip("Move a little closer. You are too far away.", false);
  else if (!sideOn) showTip("Turn sideways so the camera sees your side.", false);
  else showTip(PHASE_HINT[phase], true);
}

export function noPerson() {
  showTip("No person detected. Step into view.", false);
}