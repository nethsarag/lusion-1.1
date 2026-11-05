import "./styles/features.css";
import { FEATURES } from "./features-data.js";

// "Top Features" carousel.
// - Cards sit on a loop. The one in the middle is the active feature.
// - The yellow glass box (title) and the line under it follow the centre card.
// - Move it by: dragging / swiping, horizontal trackpad scroll, arrow keys,
//   or clicking a side card.
//
// Card sizes follow the Figma frame (1440 wide). Every number below is a
// fraction of the carousel width, so it scales with the screen.
//   x = distance of the card centre from the middle, w / h = card size,
//   r = corner radius, o = opacity.  Rows are |distance from centre| = 0,1,2,3,4.

const LAYOUTS = {
  desktop: [
    { x: 0,      w: 0.5382, h: 0.3181, r: 0.0278, o: 1 }, // centre   775 x 458 in Figma
    { x: 0.2882, w: 0.1806, h: 0.1965, r: 0.0167, o: 1 }, // 1st side 260 x 283
    { x: 0.416,  w: 0.0472, h: 0.1965, r: 0.0125, o: 1 }, // 2nd side  68 x 283
    { x: 0.4618, w: 0.016,  h: 0.1965, r: 0.009,  o: 1 }, // 3rd side  23 x 283
    { x: 0.472,  w: 0.006,  h: 0.1965, r: 0.005,  o: 0 }, // gone
  ],
  mobile: [
    { x: 0,    w: 0.8,  h: 0.4728, r: 0.045, o: 1 },
    { x: 0.45, w: 0.24, h: 0.3,    r: 0.03,  o: 1 },
    { x: 0.53, w: 0.08, h: 0.3,    r: 0.02,  o: 1 },
    { x: 0.56, w: 0.03, h: 0.3,    r: 0.015, o: 1 },
    { x: 0.57, w: 0.01, h: 0.3,    r: 0.01,  o: 0 },
  ],
};
const MOBILE_MAX = 760; // carousel width (px) at or below which the mobile layout is used
const VISIBLE_SLOTS = 9; // how many cards must exist so both sides look full

const lerp = (a, b, t) => a + (b - a) * t;
const mod = (n, m) => ((n % m) + m) % m;

function layoutAt(keys, a) {
  const last = keys.length - 1;
  if (a >= last) return keys[last];
  const i = Math.floor(a);
  const t = a - i;
  const k0 = keys[i];
  const k1 = keys[i + 1];
  return {
    x: lerp(k0.x, k1.x, t),
    w: lerp(k0.w, k1.w, t),
    h: lerp(k0.h, k1.h, t),
    r: lerp(k0.r, k1.r, t),
    o: lerp(k0.o, k1.o, t),
  };
}

function initFeatures() {
  const stage = document.getElementById("fc");
  const track = document.getElementById("fc-track");
  const caption = document.getElementById("fc-caption");
  const titleBox = document.getElementById("fc-title");
  const titleText = document.getElementById("fc-title-text");
  const descEl = document.getElementById("fc-desc");
  if (!stage || !track || !FEATURES.length) return;

  const n = FEATURES.length;
  const total = n * Math.ceil(VISIBLE_SLOTS / n); // always a multiple of n so the loop is seamless
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- build cards ----------
  const cards = [];
  for (let i = 0; i < total; i++) {
    const f = FEATURES[i % n];
    const card = document.createElement("div");
    card.className = "fc-card is-empty";
    card.dataset.g = String(i % 5); // placeholder gradient while an image is missing
    card.style.setProperty("--i", String(i));
    card.style.setProperty("--focus", f.focus || "50% 50%");
    if (i >= n) card.setAttribute("aria-hidden", "true"); // clones are decoration

    const float = document.createElement("div");
    float.className = "fc-card-float";
    const media = document.createElement("div");
    media.className = "fc-media";

    const img = document.createElement("img");
    img.className = "fc-img";
    img.alt = i < n ? f.title : "";
    img.draggable = false;
    img.decoding = "async";
    const ready = () => card.classList.remove("is-empty");
    img.addEventListener("load", ready);
    img.addEventListener("error", () => card.classList.add("is-empty"));
    img.src = f.image;
    if (img.complete && img.naturalWidth > 0) ready();

    const ph = document.createElement("span");
    ph.className = "fc-ph";
    ph.innerHTML = `<b>Image Holder</b><small>${f.image}</small>`;

    media.append(img, ph);
    float.append(media);
    card.append(float);
    track.append(card);
    cards.push({ el: card, d: 0 });
  }

  // ---------- state ----------
  let W = stage.clientWidth || 1440;
  let keys = LAYOUTS.desktop;
  let pos = 0; // current position, in cards (can be fractional while moving)
  let target = 0; // where we are heading
  let active = -1; // index of the active feature
  let raf = 0;
  let last = 0;
  let dragging = false;
  let suppressClick = false;

  const step = () => Math.max(1, keys[1].x * W); // px of dragging that equals one card

  function measure() {
    W = Math.min(stage.clientWidth || 1440, 1680);
    const mobile = W <= MOBILE_MAX;
    keys = mobile ? LAYOUTS.mobile : LAYOUTS.desktop;
    stage.classList.toggle("fc--mobile", mobile);
  }

  // ---------- drawing ----------
  function render() {
    for (let i = 0; i < total; i++) {
      const c = cards[i];
      let d = i - pos;
      d -= total * Math.round(d / total); // shortest way round the loop
      c.d = d;
      const a = Math.abs(d);
      const L = layoutAt(keys, a);
      const el = c.el;
      if (L.o < 0.01) {
        el.style.visibility = "hidden";
        continue;
      }
      el.style.visibility = "visible";
      el.style.opacity = L.o.toFixed(3);
      el.style.width = (L.w * W).toFixed(2) + "px";
      el.style.height = (L.h * W).toFixed(2) + "px";
      el.style.transform = `translate(-50%, -50%) translateX(${(Math.sign(d) * L.x * W).toFixed(2)}px)`;
      el.style.zIndex = String(Math.round(100 - a * 10));
      el.style.setProperty("--r", (L.r * W).toFixed(2) + "px");
      el.style.setProperty("--c", Math.max(0, 1 - a).toFixed(3));
    }
    setActive(mod(Math.round(pos), n));
  }

  // ---------- title + description ----------
  let swapTimer = 0;
  function fitTitle() {
    if (!titleBox || !titleText) return;
    const holder = titleText.parentElement;
    const cs = getComputedStyle(holder);
    const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const w = titleText.getBoundingClientRect().width;
    if (w > 0) titleBox.style.width = Math.ceil(w + pad) + "px";
  }
  function applyText(f) {
    if (titleText) titleText.textContent = f.title;
    if (descEl) descEl.textContent = f.description;
    fitTitle();
  }
  function setActive(i) {
    if (i === active) return;
    const first = active === -1;
    active = i;
    clearTimeout(swapTimer);
    if (first || reduceMotion || !caption) {
      applyText(FEATURES[i]);
      return;
    }
    caption.classList.add("is-swapping");
    swapTimer = setTimeout(() => {
      applyText(FEATURES[i]);
      caption.classList.remove("is-swapping");
    }, 170);
  }

  // ---------- animation loop ----------
  function tick(now) {
    const dt = Math.min(64, now - last || 16.7);
    last = now;
    if (!dragging) {
      const diff = target - pos;
      if (Math.abs(diff) < 0.0008) {
        pos = target;
        render();
        raf = 0;
        return;
      }
      const k = reduceMotion ? 0.5 : 0.13;
      pos += diff * (1 - Math.pow(1 - k, dt / 16.7));
    }
    render();
    raf = requestAnimationFrame(tick);
  }
  function run() {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  }
  function goTo(t) {
    target = t;
    run();
  }

  // ---------- input: drag / swipe ----------
  let down = null;
  let vel = 0;
  let lastPos = 0;
  let lastT = 0;

  stage.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    down = { x: e.clientX, pos };
    vel = 0;
    lastPos = pos;
    lastT = performance.now();
  });
  stage.addEventListener("pointermove", (e) => {
    if (!down) return;
    if (e.pointerType === "mouse" && e.buttons === 0) { down = null; return; } // button released outside
    const dx = e.clientX - down.x;
    if (!dragging) {
      if (Math.abs(dx) < 6) return;
      dragging = true;
      stage.classList.add("is-dragging");
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      run();
    }
    pos = down.pos - dx / step();
    const now = performance.now();
    const dt = now - lastT;
    if (dt > 0) {
      vel = lerp(vel, (pos - lastPos) / dt, 0.4); // cards per millisecond
      lastPos = pos;
      lastT = now;
    }
  });
  function endDrag() {
    if (!down) return;
    down = null;
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
    const flick = Math.max(-2, Math.min(2, vel * 220));
    target = Math.round(pos + flick);
    run();
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  // click a side card to bring it to the centre
  stage.addEventListener("click", (e) => {
    if (suppressClick) return;
    const el = e.target.closest(".fc-card");
    if (!el) return;
    const c = cards.find((x) => x.el === el);
    if (c && Math.abs(c.d) > 0.5) goTo(Math.round(pos) + Math.round(c.d));
  });

  // ---------- input: trackpad / horizontal wheel ----------
  let wheelAcc = 0;
  let wheelLock = 0;
  let wheelLast = 0;
  stage.addEventListener(
    "wheel",
    (e) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!horizontal && !e.shiftKey) return; // plain vertical scrolling still scrolls the page
      e.preventDefault();
      const dx = horizontal ? e.deltaX : e.deltaY;
      const now = performance.now();
      if (now - wheelLast > 200) wheelAcc = 0;
      wheelLast = now;
      if (now < wheelLock) return;
      wheelAcc += dx;
      if (Math.abs(wheelAcc) > 40) {
        goTo(Math.round(target) + Math.sign(wheelAcc));
        wheelAcc = 0;
        wheelLock = now + 380;
      }
    },
    { passive: false }
  );

  // ---------- input: keyboard ----------
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(Math.round(target) + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(Math.round(target) - 1); }
  });

  // ---------- resize ----------
  new ResizeObserver(() => {
    measure();
    render();
    fitTitle();
  }).observe(stage);

  measure();
  render();
  // fonts can change the text width after load
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
}

initFeatures();