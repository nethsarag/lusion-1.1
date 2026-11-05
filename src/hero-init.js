import { createMagicRings } from "./hero/magic-rings.js";
import { lusionWordmark } from "./hero/wordmark.js";

// "Lusion" wordmark in the sub heading (text + mascot face as the "o")
document.querySelectorAll("[data-wordmark]").forEach((el) => {
  el.innerHTML = lusionWordmark();
});

// Ripple background. It is mounted inside the hero only, so it never shows
// on the sections below and it pauses itself once the hero is off screen.
const ringsBox = document.getElementById("hero-rings");
if (ringsBox) {
  createMagicRings(ringsBox, {
    color: "#ffda00",
    colorTwo: "#ffda00",
    motion: "pulse",
    ringCount: 3,
    speed: 0.5,
    lineThickness: 0.5,
    glow: 0.2,
    hoverScale: 1.2,
    clickBurst: true,
    baseRadius: 0.42,
    expansion: 0.09,
    taper: 1,
    rotation: 80,
    spin: -1.55,
    theme: "light",
  });
}