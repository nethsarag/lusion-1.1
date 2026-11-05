// MagicRings: vanilla JS port for this (non-React) project.
// Same props as the react-bits component, drawn with a 2D canvas.
//
//   const rings = createMagicRings(containerEl, { color: "#ffda00", ... });
//   rings.update({ speed: 1 });   // change props later
//   rings.destroy();              // remove it
//
// It pauses itself when the container is off screen, so it costs nothing
// once you scroll past the hero.

const MAX_BURSTS = 3;
const SEGMENTS = 128;
const TAU = Math.PI * 2;

export const MAGIC_RINGS_DEFAULTS = {
  color: "#ffda00",
  colorTwo: "#ffda00",
  motion: "pulse", // "pulse" | "none"
  ringCount: 3, // 1 to 12
  speed: 0.5,
  lineThickness: 0.5,
  glow: 0.2,
  hoverScale: 1.2,
  clickBurst: true,
  baseRadius: 0.42,
  expansion: 0.09,
  taper: 1, // 0 = even line, 1 = line fades to a hairline on one side
  rotation: 80, // degrees, where the thin side of the taper starts
  spin: -1.55, // how fast (and which way) the taper turns
  theme: "light", // "light" (normal blending) | "dark" (additive glow)
  center: { x: 0.5, y: 0.52 }, // where the rings are centred, as a fraction of the box
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function hexToRgb(hex) {
  let h = String(hex).replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mixRgb = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));

export function createMagicRings(container, options = {}) {
  let opts = { ...MAGIC_RINGS_DEFAULTS, ...options };

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);
  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let running = false;
  let onScreen = true;
  let t0 = performance.now();

  // pointer state (smoothed so hover eases in and out)
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, target: 0 };
  const bursts = [];

  function resize() {
    const r = container.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (!running) draw(performance.now());
  }

  // ---- drawing -------------------------------------------------------------
  // One ring = a closed strip of 128 segments whose thickness can vary around
  // the circle (taper) and bulge near the pointer (hover).
  function ringPath(cx, cy, radius, thick, phase, hoverBoost, scaleW) {
    const inner = new Array(SEGMENTS);
    const outer = new Array(SEGMENTS);
    const unit = Math.min(w, h);
    const sigma2 = 2 * (0.22 * unit) ** 2;
    const bulge = (opts.hoverScale - 1) * 0.18;

    for (let k = 0; k < SEGMENTS; k++) {
      const a = (k / SEGMENTS) * TAU;
      const dx = Math.cos(a);
      const dy = Math.sin(a);

      let near = 0;
      if (hoverBoost > 0) {
        const px = cx + dx * radius - ptr.x;
        const py = cy + dy * radius - ptr.y;
        near = Math.exp(-(px * px + py * py) / sigma2) * hoverBoost;
      }

      const r = radius * (1 + bulge * near);
      const side = (1 + Math.cos(a - phase)) / 2; // 1 on the thin side, 0 on the thick side
      const th = thick * scaleW * (1 - 0.82 * opts.taper * side) * (1 + 1.2 * near);

      outer[k] = [cx + dx * (r + th / 2), cy + dy * (r + th / 2)];
      inner[k] = [cx + dx * (r - th / 2), cy + dy * (r - th / 2)];
    }

    const p = new Path2D();
    p.moveTo(outer[0][0], outer[0][1]);
    for (let k = 1; k < SEGMENTS; k++) p.lineTo(outer[k][0], outer[k][1]);
    p.closePath();
    p.moveTo(inner[0][0], inner[0][1]);
    for (let k = SEGMENTS - 1; k >= 0; k--) p.lineTo(inner[k][0], inner[k][1]);
    p.closePath();
    return p;
  }

  function draw(now) {
    const t = reduceMotion.matches || opts.motion === "none" ? 0 : (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = opts.theme === "dark" ? "lighter" : "source-over";

    const unit = Math.min(w, h);
    const cx = w * opts.center.x;
    const cy = h * opts.center.y;
    const count = clamp(Math.round(opts.ringCount), 1, 12);
    const c1 = hexToRgb(opts.color);
    const c2 = hexToRgb(opts.colorTwo);
    const baseThick = 0.5 + opts.lineThickness * 2.2; // px
    const coreAlpha = opts.theme === "dark" ? 0.9 : 0.55;
    const hoverBoost = ptr.strength;

    for (let i = 0; i < count; i++) {
      const rgb = mixRgb(c1, c2, count > 1 ? i / (count - 1) : 0);
      const phaseOffset = i * 1.1;
      const pulse = opts.motion === "pulse" ? Math.sin(t * opts.speed * 3 + phaseOffset) : 0;
      const radius = (opts.baseRadius + i * opts.expansion) * unit * 1.9 * (1 + 0.028 * pulse);
      const alpha = coreAlpha * (opts.motion === "pulse" ? 0.82 + 0.18 * Math.sin(t * opts.speed * 3 + phaseOffset + 1) : 1);
      const phase = (opts.rotation * Math.PI) / 180 + opts.spin * opts.speed * t * 0.35 + i * 0.5;

      // soft glow first (a fatter, fainter copy), then the sharp line on top
      if (opts.glow > 0) {
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(alpha * 0.22 * opts.glow * 4).toFixed(3)})`;
        ctx.fill(ringPath(cx, cy, radius, baseThick, phase, hoverBoost, 1 + opts.glow * 14), "nonzero");
      }
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
      ctx.fill(ringPath(cx, cy, radius, baseThick, phase, hoverBoost, 1), "nonzero");
    }

    // click bursts: a ring that grows from the click and fades
    for (let b = bursts.length - 1; b >= 0; b--) {
      const burst = bursts[b];
      const p = (now - burst.t) / 1700;
      if (p >= 1) {
        bursts.splice(b, 1);
        continue;
      }
      const ease = 1 - (1 - p) ** 3;
      const a = (1 - p) ** 2 * (opts.theme === "dark" ? 0.9 : 0.7);
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, 8 + ease * unit * 1.3, 0, TAU);
      ctx.lineWidth = Math.max(0.6, baseThick * 1.6 * (1 - p));
      ctx.strokeStyle = `rgba(${c1[0]},${c1[1]},${c1[2]},${a.toFixed(3)})`;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    // ease the hover in and out
    ptr.x += (ptr.tx - ptr.x) * 0.12;
    ptr.y += (ptr.ty - ptr.y) * 0.12;
    ptr.strength += (ptr.target - ptr.strength) * 0.08;
    draw(now);
  }

  function start() {
    if (running || !onScreen || document.hidden || reduceMotion.matches) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // ---- pointer (listened on the window, so the text on top never blocks it) ---
  function localPoint(e) {
    const r = container.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
  }
  const onMove = (e) => {
    const p = localPoint(e);
    ptr.tx = p.x;
    ptr.ty = p.y;
    if (p.inside && ptr.target === 0) {
      ptr.x = p.x;
      ptr.y = p.y;
    }
    ptr.target = p.inside ? 1 : 0;
  };
  const onLeave = () => (ptr.target = 0);
  const onDown = (e) => {
    if (!opts.clickBurst) return;
    const p = localPoint(e);
    if (!p.inside) return;
    if (e.target.closest && e.target.closest("a, input, textarea")) return;
    bursts.push({ x: p.x, y: p.y, t: performance.now() });
    if (bursts.length > MAX_BURSTS) bursts.shift();
    if (!running) draw(performance.now());
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    onScreen ? start() : stop();
  });
  io.observe(container);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);
  const onMotion = () => (reduceMotion.matches ? (stop(), draw(performance.now())) : start());
  reduceMotion.addEventListener?.("change", onMotion);

  resize();
  draw(performance.now());
  start();

  return {
    update(next) {
      opts = { ...opts, ...next };
      if (!running) draw(performance.now());
    },
    destroy() {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMotion.removeEventListener?.("change", onMotion);
      canvas.remove();
    },
  };
}