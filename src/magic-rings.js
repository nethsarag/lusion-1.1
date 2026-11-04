const canvas = document.getElementById("magic-rings");

if (canvas) {
  const context = canvas.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0.5, y: 0.42, active: false };
  const bursts = [];
  let rings = [];
  let frame = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    rings = Array.from({ length: 3 }, (_, index) => ({
      phase: index * 0.9,
      radius: 0,
    }));
  }

  function addBurst(x, y) {
    bursts.push({ x, y, age: 0 });
    if (bursts.length > 3) bursts.shift();
  }

  function drawRing(x, y, radius, alpha, lineWidth) {
    const gradient = context.createRadialGradient(x, y, radius * 0.84, x, y, radius * 1.04);
    gradient.addColorStop(0, `rgba(255, 218, 0, 0)`);
    gradient.addColorStop(0.5, `rgba(255, 218, 0, ${alpha})`);
    gradient.addColorStop(1, `rgba(255, 218, 0, 0)`);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.strokeStyle = gradient;
    context.lineWidth = lineWidth;
    context.stroke();
  }

  function render(now) {
    const elapsed = now * 0.001;
    context.clearRect(0, 0, width, height);
    const centerX = pointer.active ? pointer.x * width : width * 0.5;
    const centerY = pointer.active ? pointer.y * height : height * 0.43;
    const baseRadius = Math.max(width, height) * 0.34;
    const speed = reduceMotion.matches ? 0.02 : 0.11;

    rings.forEach((ring, index) => {
      ring.radius = baseRadius * (0.78 + ((elapsed * speed + ring.phase) % 1) * 0.46);
      drawRing(centerX, centerY, ring.radius, 0.13 - index * 0.025, 1);
    });

    bursts.forEach((burst) => {
      burst.age += reduceMotion.matches ? 0.015 : 0.035;
      drawRing(
        burst.x * width,
        burst.y * height,
        baseRadius * burst.age,
        Math.max(0, 0.22 * (1 - burst.age)),
        1.5
      );
    });
    while (bursts[0]?.age > 1.1) bursts.shift();

    frame = requestAnimationFrame(render);
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
    pointer.active = true;
  });
  canvas.addEventListener("pointerleave", () => (pointer.active = false));
  canvas.addEventListener("click", () => addBurst(pointer.x, pointer.y));
  window.addEventListener("resize", resize);
  resize();
  frame = requestAnimationFrame(render);

  window.addEventListener("pagehide", () => cancelAnimationFrame(frame), { once: true });
}
