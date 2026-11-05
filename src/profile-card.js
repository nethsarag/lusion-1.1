import "./styles/profile-card.css";

// ProfileCard: vanilla JS port of the React component you supplied.
// This repo is Vite + plain JS (no React / Next), so the same ideas are rebuilt without a framework:
//   - THEMES / FOILS colour tokens (written to CSS variables on the card)
//   - spring-driven tilt, a light that follows the cursor, holo foil + grain, avatar parallax
//   - an optional intro wobble
// Usage:  const card = createProfileCard({ name, title, handle, githubUrl, avatarUrl });
//         parent.append(card.el);   card.intro();   // intro() is optional

const THEMES = {
  dark: {
    "--pc-frame": "rgba(38, 35, 46, 0.66)",
    "--pc-frame-edge": "rgba(255, 255, 255, 0.08)",
    "--pc-frame-shadow": "0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)",
    "--pc-ink": "#f4f4f5",
    "--pc-muted": "rgba(244, 244, 245, 0.6)",
    "--pc-hover": "brightness(1.12)",
    "--pc-press": "brightness(0.8)",
    "--pc-shade": "rgba(0, 0, 0, 0.4)",
  },
  light: {
    // Figma frame is pure white, so the frame colour is #fff instead of the translucent grey
    "--pc-frame": "#ffffff",
    "--pc-frame-edge": "rgba(24, 24, 27, 0.07)",
    "--pc-frame-shadow": "0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)",
    "--pc-ink": "#0b0b0b",
    "--pc-muted": "rgba(39, 39, 42, 0.6)",
    "--pc-hover": "brightness(0.97)",
    "--pc-press": "brightness(0.92)",
    "--pc-shade": "rgba(24, 24, 27, 0.14)",
  },
};

const FOILS = {
  dark: { "--pc-blend": "color-dodge", "--pc-holo-filter": "hue-rotate(0deg)", "--pc-sheen": "rgba(255,255,255,0.16)" },
  light: { "--pc-blend": "multiply", "--pc-holo-filter": "invert(1) hue-rotate(180deg)", "--pc-sheen": "rgba(255,255,255,0)" },
};

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'><filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0.55 0 0 0 -0.24 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>"
)}")`;

// GitHub mark (Octicons "mark-github", 16x16). Uses currentColor so the CSS decides the colour.
const GITHUB_PATH =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function createProfileCard({
  avatarUrl = "",
  name = "Javi A. Torres",
  title = "Software Engineer",
  handle = "javicodes",
  status = "Online",
  statusColor = "#00e639",
  githubUrl = "",
  buttonText = "GitHub",
  theme = "light",
  radius = 16,
  holo = 0.8, // 0 to 1: strength of the rainbow foil
  glare = 0.5, // 0 to 1: strength of the light that follows the cursor
  enableTilt = true,
  tiltStrength = 12, // degrees
  parallax = 8, // px the photo slides against the card
  intro = true,
  className = "",
} = {}) {
  // ---------- markup ----------
  const wrap = el("article", `pf ${className}`.trim());
  const float = el("div", "pf-float");
  const root = el("div", "pf-card");
  const frame = el("div", "pf-frame");
  const tile = el("div", "pf-tile");

  const img = el("img", "pf-avatar");
  img.src = avatarUrl;
  img.alt = name;
  img.decoding = "async";
  img.loading = "lazy";
  img.draggable = false;

  const holoEl = el("div", "pf-holo");
  const glareEl = el("div", "pf-glare");
  const grainEl = el("div", "pf-grain");
  const shade = el("div", "pf-shade");
  const id = el("div", "pf-id");
  id.append(el("h3", "pf-name", name), el("p", "pf-title", title));
  tile.append(img, holoEl, glareEl, grainEl, shade, id);

  const meta = el("div", "pf-meta");
  const left = el("div", "pf-left");
  left.append(el("span", "pf-handle", `@${handle}`));

  const gh = el("a", "pf-gh");
  gh.href = githubUrl || `https://github.com/${handle}`;
  gh.target = "_blank";
  gh.rel = "noopener noreferrer";
  gh.setAttribute("aria-label", `${name} on GitHub (opens in a new tab)`);
  gh.innerHTML = `<svg class="pf-gh-logo" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="${GITHUB_PATH}"/></svg><span>${buttonText}</span>`;
  left.append(gh);

  const stat = el("span", "pf-status");
  const dot = el("i", "pf-dot");
  dot.style.background = statusColor;
  dot.style.boxShadow = `0 0 0 0 ${statusColor}`;
  dot.style.setProperty("--pf-dot", statusColor);
  stat.append(dot, document.createTextNode(status));

  meta.append(left, stat);
  frame.append(tile, meta);
  root.append(frame);
  float.append(root);
  wrap.append(float);

  // ---------- theme tokens ----------
  const vars = { ...THEMES[theme], ...FOILS[theme] };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.style.setProperty("--pc-grain", GRAIN);
  root.style.setProperty("--pc-radius", `${radius}px`);
  root.style.setProperty("--pc-holo-amt", String(clamp(holo, 0, 1)));
  root.style.setProperty("--pc-glare-amt", String(clamp(glare, 0, 1)));

  // ---------- motion engine ----------
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const x = { p: 0, v: 0, target: 0 }; // -1 .. 1 across the card
  const y = { p: 0, v: 0, target: 0 };
  let raf = 0;
  let last = 0;
  let introUntil = 0;
  let introStart = 0;

  const STIFFNESS = 150;
  const DAMPING = 17;

  function write() {
    const angle = enableTilt && !reduced.matches ? tiltStrength : 0;
    const depth = reduced.matches ? 0 : parallax;
    const tilt = Math.min(1, Math.hypot(x.p, y.p));
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    const s = root.style;
    s.setProperty("--pc-rx", `${(-y.p * angle).toFixed(2)}deg`);
    s.setProperty("--pc-ry", `${(x.p * angle).toFixed(2)}deg`);
    s.setProperty("--pc-light-x", `${(((x.p + 1) * 0.5) * w).toFixed(1)}px`);
    s.setProperty("--pc-light-y", `${(((y.p + 1) * 0.5) * h).toFixed(1)}px`);
    s.setProperty("--pc-pointer-x", `${((x.p + 1) * 50).toFixed(2)}%`);
    s.setProperty("--pc-pointer-y", `${((y.p + 1) * 50).toFixed(2)}%`);
    s.setProperty("--pc-tilt", tilt.toFixed(3));
    s.setProperty("--pc-par-x", `${(-x.p * depth).toFixed(2)}px`);
    s.setProperty("--pc-par-y", `${(-y.p * depth).toFixed(2)}px`);
  }

  function step(now) {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;

    // Intro wobble: sweeps the target through a small circle, then lets go
    if (introUntil > now) {
      const t = (now - introStart) / (introUntil - introStart);
      const a = t * Math.PI * 2;
      const fade = Math.sin(Math.min(1, t) * Math.PI);
      x.target = Math.cos(a) * 0.55 * fade;
      y.target = Math.sin(a) * 0.4 * fade;
    } else if (introUntil && introUntil <= now) {
      introUntil = 0;
      if (!hovering) x.target = y.target = 0;
    }

    for (const axis of [x, y]) {
      const a = (axis.target - axis.p) * STIFFNESS - axis.v * DAMPING;
      axis.v += a * dt;
      axis.p += axis.v * dt;
    }
    write();

    const settled =
      !introUntil &&
      Math.abs(x.p - x.target) < 0.001 && Math.abs(y.p - y.target) < 0.001 &&
      Math.abs(x.v) < 0.001 && Math.abs(y.v) < 0.001;
    if (settled) {
      x.p = x.target; y.p = y.target; x.v = y.v = 0;
      write();
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(step);
  }

  function wake() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  let hovering = false;
  wrap.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || reduced.matches) return;
    const r = root.getBoundingClientRect();
    hovering = true;
    x.target = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    y.target = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    root.classList.add("is-active");
    wake();
  });
  wrap.addEventListener("pointerleave", () => {
    hovering = false;
    x.target = y.target = 0; // springs back to flat
    root.classList.remove("is-active");
    wake();
  });
  wrap.addEventListener("pointerdown", () => root.classList.add("is-pressed"));
  window.addEventListener("pointerup", () => root.classList.remove("is-pressed"));

  write();

  return {
    el: wrap,
    intro() {
      if (!intro || reduced.matches) return;
      introStart = performance.now();
      introUntil = introStart + 1400;
      wake();
    },
  };
}