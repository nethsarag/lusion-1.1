import "./styles/about.css";
import { createProfileCard } from "./profile-card.js";

// About us section ("Meet Team Tesera"), built from the Figma frame.
// 1. Edit TEAM below to change the cards.   2. Cards rise in once when scrolled into view,
// then play a short light/tilt "wake up" wobble.   3. Hover tilt, light and photo parallax come from profile-card.js.

const TEAM = [
  {
    name: "Nethsara Gunathilaka",
    title: "Uva Wellassa University of Sri Lanka",
    handle: "nethsarag",
    githubUrl: "https://github.com/nethsarag",
    avatarUrl: "/images/team/nethsara.jpg",
  },
  // The Figma frame repeats the same person three times as a placeholder.
  // Replace these two with the real teammates (name, title, handle, githubUrl, avatarUrl).
  {
    name: "Nethsara Gunathilaka",
    title: "Uva Wellassa University of Sri Lanka",
    handle: "nethsarag",
    githubUrl: "https://github.com/nethsarag",
    avatarUrl: "/images/team/nethsara.jpg",
  },
  {
    name: "Nethsara Gunathilaka",
    title: "Uva Wellassa University of Sri Lanka",
    handle: "nethsarag",
    githubUrl: "https://github.com/nethsarag",
    avatarUrl: "/images/team/nethsara.jpg",
  },
];

const section = document.getElementById("about");
const grid = document.getElementById("about-grid");

if (section && grid) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  const cards = TEAM.map((member, i) => {
    const card = createProfileCard({ ...member, theme: "light", status: "Online" });
    card.el.style.setProperty("--d", i);
    grid.append(card.el);
    return card;
  });

  section.classList.add("is-armed"); // hides the cards, so only do this once JS is running

  if ("IntersectionObserver" in window && !reduce.matches) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          const card = cards.find((c) => c.el === e.target);
          // wobble once the rise-in has mostly finished
          setTimeout(() => card && card.intro(), 700 + cards.indexOf(card) * 150);
          io.unobserve(e.target);
        }
      },
      { threshold: 0.25 }
    );
    cards.forEach((c) => io.observe(c.el));
  } else {
    cards.forEach((c) => c.el.classList.add("is-in"));
  }
}