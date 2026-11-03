import "./styles/glass-button.css";

// Upgrades every button on the page to the glass button style.
// It runs once on load and keeps watching, so buttons added later
// (by any script) are upgraded too. Nothing else needs to be done
// when you add a new button: <button>, a.btn and a.nav-cta are picked up.
//
// Optional per-button settings:
//   data-glass-size="sm | lg | icon"   (default size otherwise)
//   data-glass="off"                   (skip this button)
//   class="btn-primary"                (brand yellow fill under the glass)

const SELECTOR = "button, a.btn, a.nav-cta, [data-glass-button]";

// Small buttons by class, so existing markup needs no changes
const SMALL_CLASSES = ["btn-quiet", "nav-cta", "nav-toggle"];

function sizeFor(el) {
  const explicit = el.dataset.glassSize;
  if (explicit) return explicit;
  return SMALL_CLASSES.some((c) => el.classList.contains(c)) ? "sm" : "default";
}

export function glassify(el) {
  if (el.dataset.glass === "off") return;
  if (el.classList.contains("glass-button") || el.closest(".glass-button-wrap")) return;
  if (!el.parentNode) return;

  const size = sizeFor(el);
  el.classList.add("glass-button");
  if (size !== "default") el.classList.add(`glass-button--${size}`);

  // Wrap the label so the shine layer has something to sit on
  const text = document.createElement("span");
  text.className = "glass-button-text";
  text.append(...el.childNodes);
  el.append(text);

  const wrap = document.createElement("div");
  wrap.className = "glass-button-wrap";
  const shadow = document.createElement("div");
  shadow.className = "glass-button-shadow";
  shadow.setAttribute("aria-hidden", "true");

  // The original element is moved, not cloned, so ids and listeners stay intact
  el.parentNode.insertBefore(wrap, el);
  wrap.append(el, shadow);
}

function upgradeWithin(root) {
  if (root.nodeType !== 1) return;
  if (root.matches(SELECTOR)) glassify(root);
  root.querySelectorAll(SELECTOR).forEach(glassify);
}

export function initGlassButtons(root = document.body) {
  upgradeWithin(root);
  new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach(upgradeWithin);
  }).observe(root, { childList: true, subtree: true });
}
