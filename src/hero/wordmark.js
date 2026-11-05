import { SIZE, FACE_RX, EYES, MUSTACHE } from "../mascot/mascot-svg.js";

// The "Lusion" wordmark for the hero sub heading: real text for "Lusi" and "n",
// with the mascot face drawn as a tiny inline SVG in place of the "o".
// It reuses the mascot's own coordinates, so the face always matches the mascot.
// Because it is text + SVG (not a PNG) it stays sharp at any size and follows
// the font-size of the line it sits in (the SVG is sized in em in home.css).

const eye = (e) =>
  `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="48" ry="48"/>`;

export function lusionWordmark() {
  return (
    `<span aria-hidden="true">Lusi</span>` +
    `<svg class="wm-o" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true" focusable="false">` +
    `<rect width="${SIZE}" height="${SIZE}" rx="${FACE_RX}" ry="${FACE_RX}" fill="#161515"/>` +
    `<g fill="#ffda00">${eye(EYES.L)}${eye(EYES.R)}` +
    `<path transform="translate(${MUSTACHE.shift} ${MUSTACHE.shift})" d="${MUSTACHE.d}"/></g>` +
    `</svg>` +
    `<span aria-hidden="true">n</span>`
  );
}