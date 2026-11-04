import { mascotSVG, EYES, MUSTACHE, SIZE } from "./mascot-svg.js";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const C = SIZE / 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (p) => p * p * (3 - 2 * p);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// A damped spring. Low damping gives the bouncy, squash-and-stretch feel.
class Spring {
  constructor(x = 0, k = 200, z = 0.6) {
    this.x = x;
    this.v = 0;
    this.t = x;
    this.k = k;
    this.z = z;
  }
  step(dt) {
    const c = 2 * this.z * Math.sqrt(this.k);
    const n = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += (this.k * (this.t - this.x) - c * this.v) * h;
      this.x += this.v * h;
    }
  }
}

// ---------------------------------------------------------------------------
// Emotes. Eyes are described by how far the top (t) and bottom (b) edge move
// from the neutral rectangle, plus a width change (w) and a tilt (rot).
// The curious, skeptical and soft poses come straight from the logo sheet.
// ---------------------------------------------------------------------------
const eye = (t = 0, b = 0, w = 0, rot = 0) => ({ t, b, w, rot });
const mus = (ox = 0, oy = 0, rot = 0, sx = 1, sy = 1) => ({ ox, oy, rot, sx, sy });
const face = (rot = 0, sx = 1, sy = 1) => ({ rot, sx, sy });

const EMOTES = {
  neutral: { L: eye(), R: eye(), mus: mus(), face: face() },
  curiousL: { L: eye(0, -65.5), R: eye(-8, 8, 4), mus: mus(-6, 0, -2.5), face: face(-2) },
  skepticL: { L: eye(89, 0), R: eye(-4, 4), mus: mus(8, 0, 3, 0.97), face: face(-1.5) },
  smug: { L: eye(72, 0), R: eye(72, 0), mus: mus(0, 4, 0, 1, 0.96), face: face() },
  soft: { L: eye(7.7, -36), R: eye(0, -28), mus: mus(0, 2), face: face(1.5) },
  wide: { L: eye(-20, 20, 12), R: eye(-20, 20, 12), mus: mus(0, -6, 0, 1.02, 1.05), face: face(0, 1.02, 1.03) },
  happy: { L: eye(68, -52, 0, -5), R: eye(68, -52, 0, 5), mus: mus(0, -8, 0, 1.03, 1.12), face: face(0, 1, 0.99) },
  sleepy: { L: eye(108, -8), R: eye(108, -8), mus: mus(0, 6, 0, 1, 0.94), face: face(2.5) },
  thinking: { L: eye(46, 0, 0, -3), R: eye(-14, 6), mus: mus(-10, 2, -5), face: face(-2) },
  shy: { L: eye(98, -98, 0, -4), R: eye(98, -98, 0, 4), mus: mus(0, 6, 0, 1, 0.95), face: face(0, 1, 0.98) },
  wink: { L: eye(-4, 4), R: eye(98, -98), mus: mus(0, -5, 2, 1, 1.08), face: face(1.5) },
  squeeze: { L: eye(60, -60, 0, -8), R: eye(60, -60, 0, 8), mus: mus(0, 10, 0, 1, 0.9), face: face(0, 1.06, 0.94) },
};

function mirrored(e) {
  const flip = (x) => ({ ...x, rot: -x.rot });
  return {
    L: flip(e.R),
    R: flip(e.L),
    mus: { ...e.mus, ox: -e.mus.ox, rot: -e.mus.rot },
    face: { ...e.face, rot: -e.face.rot },
  };
}
EMOTES.curiousR = mirrored(EMOTES.curiousL);
EMOTES.skepticR = mirrored(EMOTES.skepticL);

const AMBIENT = ["neutral", "soft", "curiousL", "curiousR", "skepticL", "skepticR", "neutral", "happy"];
const WIGGLY = new Set(["happy", "squeeze", "wink"]);

// ---------------------------------------------------------------------------
// The mascot
// ---------------------------------------------------------------------------
export class Mascot {
  /**
   * @param {{anchor?: HTMLElement|null}} opts  anchor = the hero placeholder.
   * Without an anchor the mascot lives in the corner only.
   */
  constructor({ anchor = null, pinned = false } = {}) {
    this.anchor = anchor;
    // pinned: stay on the anchor (no scroll-to-corner flight, no chat). Used inside the Get Started card.
    this.pinned = pinned;
    this.look = null; // {x, y, until, emote}: look at a point on the page (form fields)
    this.holdName = null; // emote held while a field has focus
    this.heroEl = anchor ? anchor.closest(".hero") || anchor : null;
    this.mode = anchor ? "hero" : "dock";
    this.onActivate = null; // called when the docked mascot is clicked
    this.onModeChange = null;
    this.chatOpen = false;

    this.ptr = { x: 0, y: 0, t: 0, lastMove: performance.now() / 1000, speed: 0, seen: false };
    this.over = null; // {name, until} one-off reactions (boop, flick)
    this.mood = null; // "thinking" | "talking" (set by the chat)
    this.react_ = null; // {name, until} short mood after a chat reply
    this.zone = "neutral";
    this.zoneCand = "neutral";
    this.zoneSince = 0;
    this.cur = null;
    this.ambientEmote = "neutral";
    this.ambientNext = 0;
    this.gaze = { x: 0, y: 0 };
    this.sleeping = false;
    this.blinkNext = 2;
    this.sacNext = 1;
    this.flickCool = 0;
    this.prevX = null;
    this.moveVx = 0;
    this.p = 0; // smoothed hero -> dock progress
    this.last = performance.now();
    this.motion = reduceMotion.matches ? 0.3 : 1;
    reduceMotion.addEventListener?.("change", () => (this.motion = reduceMotion.matches ? 0.3 : 1));

    this.build();
    this.makeSprings();
    this.bind();
    this.setEmote("neutral");
    requestAnimationFrame((n) => this.frame(n));
  }

  // ---- DOM -----------------------------------------------------------------
  build() {
    const root = document.createElement("div");
    root.className = "mascot";
    root.dataset.mode = this.mode;
    if (this.pinned) root.classList.add("is-pinned");
    root.innerHTML = `
      <div class="mascot-glow"></div>
      <div class="mascot-shadow"></div>
      <div class="mascot-body">${mascotSVG()}</div>
      <div class="mascot-zzz" aria-hidden="true"><span>z</span><span>z</span><span>Z</span></div>
      <div class="mascot-bubble" role="status" aria-live="polite"></div>
      <button class="mascot-hit" type="button" data-glass="off"></button>`;
    document.body.append(root);

    this.root = root;
    this.hit = root.querySelector(".mascot-hit");
    this.bubble = root.querySelector(".mascot-bubble");
    this.shadow = root.querySelector(".mascot-shadow");
    const q = (s) => root.querySelector(`[data-part="${s}"]`);
    this.parts = { face: q("face"), features: q("features"), L: q("eyeL"), R: q("eyeR"), mus: q("mustache") };
    this.updateLabel();
  }

  updateLabel() {
    const docked = this.mode !== "hero";
    this.hit.setAttribute(
      "aria-label",
      docked ? "Open the Lusion AI chat" : "Lusion mascot. Press to say hi."
    );
    if (docked) this.hit.setAttribute("aria-expanded", String(this.chatOpen));
    else this.hit.removeAttribute("aria-expanded");
  }

  // ---- Springs ---------------------------------------------------------------
  makeSprings() {
    const sp = {};
    const add = (name, k, z, x = 0) => (sp[name] = new Spring(x, k, z));
    for (const s of ["L", "R"]) {
      add(`${s}.t`, 320, 0.62);
      add(`${s}.b`, 320, 0.62);
      add(`${s}.w`, 260, 0.6);
      add(`${s}.rot`, 220, 0.6);
    }
    add("mus.ox", 200, 0.55);
    add("mus.oy", 200, 0.5);
    add("mus.rot", 200, 0.45);
    add("mus.sx", 220, 0.5, 1);
    add("mus.sy", 220, 0.5, 1);
    add("face.rot", 110, 0.6);
    add("face.sx", 150, 0.5, 1);
    add("face.sy", 150, 0.5, 1);
    add("lx", 130, 0.78); // where the mascot looks, -1..1
    add("ly", 130, 0.78);
    add("blink", 1100, 0.85);
    add("boop", 170, 0.3);
    add("wig", 80, 1);
    add("talk", 120, 0.9);
    add("sacx", 260, 0.9);
    add("sacy", 260, 0.9);
    add("tilt", 90, 0.7); // lean while flying between hero and corner
    this.sp = sp;
  }

  setEmote(name) {
    if (this.cur === name) return;
    this.cur = name;
    const e = EMOTES[name] || EMOTES.neutral;
    const sp = this.sp;
    for (const s of ["L", "R"]) {
      sp[`${s}.t`].t = e[s].t;
      sp[`${s}.b`].t = e[s].b;
      sp[`${s}.w`].t = e[s].w;
      sp[`${s}.rot`].t = e[s].rot;
    }
    sp["mus.ox"].t = e.mus.ox;
    sp["mus.oy"].t = e.mus.oy;
    sp["mus.rot"].t = e.mus.rot;
    sp["mus.sx"].t = e.mus.sx;
    sp["mus.sy"].t = e.mus.sy;
    sp["face.rot"].t = e.face.rot;
    sp["face.sx"].t = e.face.sx;
    sp["face.sy"].t = e.face.sy;
    sp.wig.t = WIGGLY.has(name) ? 1 : 0;
  }

  // ---- Events ------------------------------------------------------------------
  bind() {
    const P = this.ptr;
    window.addEventListener(
      "pointermove",
      (e) => {
        const now = performance.now() / 1000;
        if (P.seen) {
          const dt = Math.max(now - P.t, 0.008);
          P.speed = lerp(P.speed, Math.hypot(e.clientX - P.x, e.clientY - P.y) / dt, 0.3);
        }
        if (this.sleeping) this.reactNow("wide", 0.6);
        P.x = e.clientX;
        P.y = e.clientY;
        P.t = now;
        P.lastMove = now;
        P.seen = true;
      },
      { passive: true }
    );
    document.documentElement.addEventListener("pointerleave", () => (P.lastMove = -99));
    window.addEventListener("blur", () => (P.lastMove = -99));

    this.hit.addEventListener("pointerdown", () => this.boop());
    this.hit.addEventListener("click", () => {
      if (this.pinned) {
        this.say(pick(["Hi! I'm Lusion. Let's get you set up.", "Psst. Pick your role below.", "Your lifts, my eyes."]), 2800);
        this.reactNow("wink", 1.1);
      } else if (this.mode === "hero") {
        this.say(matchMedia("(hover: none)").matches ? "Hi! Scroll down and I'll wait in the corner." : "Hi! Scroll down and I'll wait in the corner for you.", 3200);
        this.reactNow("wink", 1.1);
      } else {
        this.onActivate?.();
      }
    });
  }

  boop() {
    this.sp.boop.x = 0;
    this.sp.boop.v = 6;
    this.reactNow("squeeze", 0.5);
    setTimeout(() => this.reactNow("happy", 1.3), 480);
  }

  /** Show an emote for a short time, above everything the cursor is doing. */
  reactNow(name, seconds) {
    this.over = { name, until: performance.now() / 1000 + seconds };
  }

  /** Used by the chat: "thinking" | "talking" | null */
  setMood(mood) {
    this.mood = mood;
  }

  /** Used by the chat: hold an emote after a reply. */
  react(name, seconds = 1.6) {
    this.react_ = { name, until: performance.now() / 1000 + seconds };
  }

  say(text, ms = 4000) {
    if (this.chatOpen) return;
    this.bubble.textContent = text;
    this.bubble.classList.add("show");
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => this.bubble.classList.remove("show"), ms);
  }

  setChatOpen(open) {
    this.chatOpen = open;
    if (open) this.bubble.classList.remove("show");
    this.updateLabel();
  }

  focus() {
    this.hit.focus();
  }

  // ---- Form helpers (Get Started page) ---------------------------------------
  /** Look at a point on the page for a while. */
  lookAt(x, y, seconds = 2.5, emote = "curiousL") {
    this.look = { x, y, until: performance.now() / 1000 + seconds, emote };
    this.poke();
  }

  /** Look at the middle of an element, optionally at a fraction across it (0..1). */
  lookAtEl(el, frac = 0.5, seconds = 2.5, emote = "curiousL") {
    const r = el.getBoundingClientRect();
    this.lookAt(r.left + r.width * frac, r.top + r.height / 2, seconds, emote);
  }

  /** Hold an emote (e.g. "shy" while a password is typed). Pass null to release. */
  hold(name) {
    this.holdName = name;
    this.poke();
  }

  /** Counts as activity, so typing keeps the mascot awake. */
  poke() {
    this.ptr.lastMove = performance.now() / 1000;
    if (this.sleeping) this.reactNow("wide", 0.5);
  }

  /** Shake the head "no". */
  shake() {
    this.sp["face.rot"].v = 900;
    this.sp["mus.rot"].v = -600;
    this.reactNow("skepticL", 1.4);
  }

  /** Happy hop. */
  cheer(seconds = 1.6) {
    this.sp.boop.x = 0;
    this.sp.boop.v = 7;
    this.reactNow("happy", seconds);
  }

  // ---- Layout: hero spot -> corner, driven by scroll ----------------------------
  layout(dt) {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const dockSize = vw < 520 ? 64 : 80;
    const margin = vw < 520 ? 14 : 20;
    const dockX = vw - margin - dockSize;
    const dockY = vh - margin - dockSize;
    const docStyle = document.documentElement.style;
    if (this._dockSize !== dockSize) {
      docStyle.setProperty("--mascot-dock", `${dockSize}px`);
      docStyle.setProperty("--mascot-margin", `${margin}px`);
      this._dockSize = dockSize;
    }

    let target = 1;
    let ar = null;
    if (this.anchor) {
      ar = this.anchor.getBoundingClientRect();
      const heroH = this.heroEl.offsetHeight || vh;
      target = this.pinned ? 0 : clamp(window.scrollY / (heroH * 0.55), 0, 1);
    }
    if (this.firstLayout === undefined) this.p = target;
    const k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt * 9);
    this.p += (target - this.p) * k;
    const e = smooth(clamp(this.p, 0, 1));

    const x = ar ? lerp(ar.left, dockX, e) : dockX;
    const y = ar ? lerp(ar.top, dockY, e) : dockY;
    const size = ar ? lerp(ar.width, dockSize, e) : dockSize;

    // lean in the direction of travel
    if (this.prevX !== null) this.moveVx = (x - this.prevX) / Math.max(dt, 0.001);
    this.prevX = x;
    this.sp.tilt.t = clamp(this.moveVx * 0.012, -10, 10) * (e > 0.02 && e < 0.98 ? 1 : 0);

    const r = this.root;
    r.style.width = r.style.height = `${size.toFixed(2)}px`;
    r.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    r.style.setProperty("--dock", e.toFixed(3));
    if (this.firstLayout === undefined) {
      this.firstLayout = true;
      r.classList.add("is-ready");
    }

    const mode = e < 0.02 ? "hero" : e > 0.98 ? "dock" : "moving";
    if (mode !== this.mode) {
      this.mode = mode;
      r.dataset.mode = mode;
      this.updateLabel();
      this.onModeChange?.(mode);
      if (mode === "dock" && !this.greeted) {
        this.greeted = true;
        let seen = false;
        try {
          seen = sessionStorage.getItem("lusion-mascot-greeted") === "1";
          sessionStorage.setItem("lusion-mascot-greeted", "1");
        } catch (_) {}
        if (!seen) setTimeout(() => this.say("Need a hand? Click me and ask anything.", 5200), 500);
      }
    }
    this.cx = x + size / 2;
    this.cy = y + size / 2;
    this.size = size;
  }

  // ---- Decide how the mascot feels this frame ---------------------------------
  pickZone(nx, ny, stationary) {
    const d = Math.hypot(nx, ny);
    if (d < 0.2) return "wide"; // nose to nose
    if (d < 0.6) return ny > 0.25 ? "happy" : stationary ? "soft" : "wide"; // over the moustache = happy
    if (d > 2.8) return "neutral"; // far away, relaxed
    const side = nx < 0 ? "L" : "R";
    if (ny < -0.35) return Math.abs(nx) < 0.45 ? "wide" : `curious${side}`;
    if (ny > 0.35) return Math.abs(nx) < 0.45 ? "smug" : `skeptic${side}`;
    return `curious${side}`;
  }

  think(t, dt) {
    const P = this.ptr;
    const idle = t - P.lastMove;
    const active = P.seen && idle < 3.2;
    P.speed *= Math.exp(-dt * 5);

    let emote = "neutral";
    let gx = 0;
    let gy = 0;
    this.sleeping = false;

    const lk = this.look && t < this.look.until ? this.look : null;
    if (lk) {
      const R = Math.max(this.size / 2, 150);
      gx = Math.tanh((lk.x - this.cx) / (R * 1.1));
      gy = Math.tanh((lk.y - this.cy) / (R * 1.1));
      emote = lk.emote;
    } else if (active) {
      const R = Math.max(this.size / 2, 150);
      const dx = P.x - this.cx;
      const dy = P.y - this.cy;
      gx = Math.tanh(dx / (R * 1.1));
      gy = Math.tanh(dy / (R * 1.1));
      const zone = this.pickZone(dx / R, dy / R, P.speed < 120);
      if (zone !== this.zoneCand) {
        this.zoneCand = zone;
        this.zoneSince = t;
      }
      if (t - this.zoneSince > 0.11) this.zone = zone;
      emote = this.zone;
      // a fast flick of the cursor startles it
      if (P.speed > 2200 && t > this.flickCool) {
        this.flickCool = t + 1.4;
        this.reactNow("wide", 0.45);
      }
    } else if (idle > 14) {
      emote = "sleepy";
      this.sleeping = true;
      gy = 0.4;
    } else {
      if (t > this.ambientNext) {
        this.ambientEmote = pick(AMBIENT);
        this.gaze = { x: rand(-0.7, 0.7), y: rand(-0.4, 0.45) };
        this.ambientNext = t + rand(2.6, 5.2);
      }
      emote = this.ambientEmote;
      gx = this.gaze.x;
      gy = this.gaze.y;
    }

    if (this.holdName) emote = this.holdName;

    // chat moods and one-off reactions win over the cursor
    if (this.mood === "thinking") {
      emote = "thinking";
      gx = 0.75;
      gy = -0.8;
    } else if (this.mood === "talking") {
      emote = "soft";
    } else if (this.react_ && t < this.react_.until) {
      emote = this.react_.name;
    }
    if (this.over && t < this.over.until) emote = this.over.name;

    this.setEmote(emote);
    this.sp.lx.t = gx;
    this.sp.ly.t = gy;
    this.sp.talk.t = this.mood === "talking" ? 1 : 0;

    // blinking
    if (!this.sleeping && t > this.blinkNext) {
      this.sp.blink.t = 1;
      setTimeout(() => (this.sp.blink.t = 0), 95);
      if (Math.random() < 0.18) {
        setTimeout(() => (this.sp.blink.t = 1), 210);
        setTimeout(() => (this.sp.blink.t = 0), 300);
      }
      this.blinkNext = t + rand(2, 5.2);
    }
    // tiny eye movements
    if (t > this.sacNext) {
      this.sp.sacx.t = rand(-3, 3);
      this.sp.sacy.t = rand(-2.5, 2.5);
      this.sacNext = t + rand(0.7, 1.9);
    }
    this.root.classList.toggle("is-sleeping", this.sleeping);
  }

  // ---- Draw ------------------------------------------------------------------------
  render(t) {
    const sp = this.sp;
    const m = this.motion;
    const lx = sp.lx.x;
    const ly = sp.ly.x;
    const breathe = Math.sin(t * 1.7);
    const bob = Math.sin(t * 1.15);

    // whole face: look toward the cursor, bob, breathe, squash on boop
    const fRot = sp["face.rot"].x + lx * 3.5 + Math.sin(t * 0.7) * 0.8 * m + sp.tilt.x;
    const fsx = sp["face.sx"].x * (1 - 0.006 * breathe * m) + sp.boop.x * 0.012;
    const fsy = sp["face.sy"].x * (1 + 0.01 * breathe * m) - sp.boop.x * 0.02;
    const fox = lx * 10;
    const foy = ly * 8 + bob * 7 * m;
    this.parts.face.setAttribute(
      "transform",
      `translate(${fox.toFixed(2)} ${foy.toFixed(2)}) rotate(${fRot.toFixed(2)} ${C} ${C}) translate(${C} ${C}) scale(${fsx.toFixed(4)} ${fsy.toFixed(4)}) translate(${-C} ${-C})`
    );
    this.shadow.style.transform = `scaleX(${(1 - bob * 0.05 * m).toFixed(3)})`;

    // features sit above the face and move a bit more: that is the depth
    this.parts.features.setAttribute("transform", `translate(${(lx * 16).toFixed(2)} ${(ly * 12).toFixed(2)})`);

    // eyes
    const blink = clamp(sp.blink.x, 0, 1);
    for (const s of ["L", "R"]) {
      const E = EYES[s];
      const ww = sp[`${s}.w`].x;
      let top = E.y + sp[`${s}.t`].x;
      let bot = E.y + E.h + sp[`${s}.b`].x;
      const mid = (top + bot) / 2;
      top += (mid - top) * blink;
      bot += (mid - bot) * blink;
      let h = bot - top;
      if (h < 6) {
        const c = (top + bot) / 2;
        top = c - 3;
        h = 6;
      }
      const w = E.w + ww;
      const x = E.x - ww / 2;
      const rx = Math.min(h / 2, clamp(35.65 + (h - 107.46) * 0.1411, 6, 56));
      const el = this.parts[s];
      el.setAttribute("x", x.toFixed(2));
      el.setAttribute("y", top.toFixed(2));
      el.setAttribute("width", w.toFixed(2));
      el.setAttribute("height", h.toFixed(2));
      el.setAttribute("rx", rx.toFixed(2));
      el.setAttribute("ry", rx.toFixed(2));
      const ex = lx * 14 + sp.sacx.x;
      const ey = ly * 11 + sp.sacy.x;
      el.setAttribute(
        "transform",
        `translate(${ex.toFixed(2)} ${ey.toFixed(2)}) rotate(${sp[`${s}.rot`].x.toFixed(2)} ${(x + w / 2).toFixed(2)} ${(top + h / 2).toFixed(2)})`
      );
    }

    // moustache: sways, wiggles when happy, bounces when "talking"
    const talk = sp.talk.x * (0.07 * Math.abs(Math.sin(t * 12.5)) + 0.04 * Math.abs(Math.sin(t * 7.1 + 1)));
    const wig = sp.wig.x * Math.sin(t * 16) * 3.2 * m;
    const think = this.mood === "thinking" ? Math.sin(t * 5) * 2.2 : 0;
    const mrot = sp["mus.rot"].x + Math.sin(t * 1.4) * 0.9 * m + wig + think;
    const mox = sp["mus.ox"].x + lx * 8;
    const moy = sp["mus.oy"].x + ly * 6 + talk * 90;
    const msx = sp["mus.sx"].x * (1 - talk * 0.25);
    const msy = sp["mus.sy"].x * (1 + talk);
    this.parts.mus.setAttribute(
      "transform",
      `translate(${mox.toFixed(2)} ${moy.toFixed(2)}) translate(${MUSTACHE.cx} ${MUSTACHE.cy}) rotate(${mrot.toFixed(2)}) scale(${msx.toFixed(4)} ${msy.toFixed(4)}) translate(${-MUSTACHE.cx} ${-MUSTACHE.cy})`
    );
  }

  frame(now) {
    const dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    const t = now / 1000;
    this.layout(dt);
    this.think(t, dt);
    for (const k in this.sp) this.sp[k].step(dt);
    this.render(t);
    requestAnimationFrame((n) => this.frame(n));
  }
}