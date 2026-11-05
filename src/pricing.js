import "./styles/pricing.css";

// Pricing section ("Choose Your Plan").
// 1. Cards rise in once when they scroll into view.
// 2. Cards tilt toward the cursor and a soft light follows it (mouse / pen only).
// 3. Hovering (or keyboard-focusing, or tapping) the Pro card tells the mascot to show
//    spinning star eyes, by sending the "lusion:star-eyes" event that src/mascot/mascot.js listens for.

const section = document.getElementById("pricing");

if (section) {
  const cards = [...section.querySelectorAll(".pc")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- 1. entrance ----------
  section.classList.add("is-armed"); // hides the cards, so only do this once JS is running
  if ("IntersectionObserver" in window && !reduce.matches) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.25 }
    );
    cards.forEach((c) => io.observe(c));
  } else {
    cards.forEach((c) => c.classList.add("is-in"));
  }

  // ---------- 2. tilt + light ----------
  const MAX_TILT_Y = 7; // degrees, left / right
  const MAX_TILT_X = 5; // degrees, up / down

  cards.forEach((card) => {
    const face = card.querySelector(".pc-card");
    if (!face) return;

    card.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch" || reduce.matches) return;
      const r = card.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      face.classList.add("is-tracking");
      face.style.setProperty("--ry", `${((px - 0.5) * 2 * MAX_TILT_Y).toFixed(2)}deg`);
      face.style.setProperty("--rx", `${((0.5 - py) * 2 * MAX_TILT_X).toFixed(2)}deg`);
      face.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      face.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    });

    card.addEventListener("pointerleave", () => {
      face.classList.remove("is-tracking"); // slow, smooth return to flat
      face.style.setProperty("--ry", "0deg");
      face.style.setProperty("--rx", "0deg");
    });
  });

  // ---------- 3. mascot star eyes ----------
  const pro = section.querySelector(".pc--pro");
  if (pro) {
    let tapTimer = 0;
    const stars = (on) => window.dispatchEvent(new CustomEvent("lusion:star-eyes", { detail: { on } }));

    pro.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "touch") stars(true);
    });
    pro.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "touch") stars(false);
    });

    // Touch screens have no hover: a tap on the card shows the stars for a couple of seconds
    pro.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      stars(true);
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => stars(false), 2400);
    });

    // Keyboard users: tabbing to "Upgrade Plan" does the same
    pro.addEventListener("focusin", () => stars(true));
    pro.addEventListener("focusout", (e) => {
      if (!pro.contains(e.relatedTarget)) stars(false);
    });

    // Never leave the stars on by accident
    window.addEventListener("blur", () => stars(false));
    document.addEventListener("visibilitychange", () => document.hidden && stars(false));
  }
}