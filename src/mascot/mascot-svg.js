// The mascot drawn as a live vector rig.
// Source: Logo-01.svg (face, two yellow eyes, moustache). The raster glow layers
// in that file are replaced by an SVG blur filter, so everything stays sharp at
// any size and every part can be animated on its own.
//
// Coordinates are the original face coordinates shifted so the face starts at 0,0.

export const SIZE = 823;
export const FACE_RX = 239.45;

// Neutral eye rectangles (the "open" pose from the logo sheet)
export const EYES = {
  L: { x: 136.74, y: 229.79, w: 196.18, h: 196.18 },
  R: { x: 457.73, y: 229.81, w: 196.18, h: 196.18 },
};

// Moustache outline (original coordinates) and its pivot, in shifted coordinates
export const MUSTACHE = {
  d: "m299.49,657.51c-4.59-7.31-10.49-11.38-18.41-12-10.97-.85-19.79,4.74-22.96,14.35-4.26,12.89-.15,25.96,10.69,32.63,11.52,7.09,24.35,8.26,37.43,6.84,16.5-1.79,30.3-10.06,43.64-19.18,15.39-10.52,29.77-22.47,45.69-32.25,15.25-9.38,31.36-16.3,49.39-18.33,19.86-2.24,36.92,3.25,50.66,17.89,3.04,3.24,4.34,4.28,8.02.26,17.2-18.79,38.84-21.72,62.51-16.17,16.79,3.94,31.75,11.88,45.77,21.62,13.49,9.38,26.57,19.35,40.12,28.64,15.1,10.35,31.12,18.6,50.19,17.98,7.77-.25,15.44-1.24,22.72-4.26,13.77-5.73,20.27-18.04,17.15-32.67-1.82-8.52-6.82-14.28-15.25-16.57-8.92-2.42-16.8-.25-23.33,6.39-1.15,1.17-2.08,2.54-3.15,3.85-2.02-4.06-1.22-8.93,2.23-14.07,7.32-10.91,23.67-16.37,37.05-11.69,18.77,6.56,27.7,21.57,31.13,39.88,5.52,29.45-5.22,53.36-27.63,72.23-20.3,17.1-44.41,25.36-70.51,27.76-43.96,4.04-86.55-2.1-127.5-18.7-16.01-6.49-30.83-15.08-42.99-27.69-1.27-1.32-2.14-2.91-4.28-.7-20.28,20.89-46.14,31.42-73.5,38.76-33.48,8.99-67.52,12.39-102.02,7.39-30.77-4.46-57.83-16.46-77.7-41.36-18.68-23.41-21.32-55.86-6.98-79.37,10.87-17.83,29.65-24.53,46.94-16.5,7.84,3.64,13.79,9.19,15.43,18.25.37,2.02.47,3.99-.55,6.81Z",
  shift: -88.5,
  cx: 411.9,
  cy: 612,
};

let uid = 0;

export function mascotSVG() {
  const id = `m${++uid}`;
  return `
<svg class="mascot-svg" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${id}-sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".10"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="${id}-glow" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="13" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .75 0" result="halo"/>
      <feMerge><feMergeNode in="halo"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g data-part="face">
    <rect width="${SIZE}" height="${SIZE}" rx="${FACE_RX}" ry="${FACE_RX}" fill="#161515"/>
    <rect width="${SIZE}" height="${SIZE}" rx="${FACE_RX}" ry="${FACE_RX}" fill="url(#${id}-sheen)"/>
    <g data-part="features" filter="url(#${id}-glow)" fill="#ffda00">
      <rect data-part="eyeL"/>
      <rect data-part="eyeR"/>
      <g data-part="mustache"><path transform="translate(${MUSTACHE.shift} ${MUSTACHE.shift})" d="${MUSTACHE.d}"/></g>
    </g>
  </g>
</svg>`;
}
