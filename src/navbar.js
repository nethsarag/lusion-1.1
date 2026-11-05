import "../styles/navbar.css";
import { lusionWordmark } from "../hero/wordmark.js";

// Edit these arrays to change the navbar on every page.
export const NAV_LINKS = [
  { label: "Home", href: "/#home" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Features", href: "/#features" },
  { label: "About us", href: "/#about" },
  { label: "Log in", href: "/login.html" },
];
export const NAV_CTA = { label: "Get Started", href: "/signup.html" };

function isCurrent(href) {
  if (href.includes("#")) return false; // anchors are never the "current page"
  const path = location.pathname;
  if (href === "/") return path === "/" || path === "/index.html";
  return path === href;
}

function makeLink({ label, href }, className) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = href;
  a.textContent = label;
  if (className) a.className = className;
  if (isCurrent(href)) a.setAttribute("aria-current", "page");
  // "#" links are placeholders for pages that do not exist yet: do not jump to the top
  if (href === "#") a.addEventListener("click", (e) => e.preventDefault());
  li.append(a);
  return li;
}

const isHomePath = (p) => p === "/" || p === "/index.html";

// Sticky-state + "which section am I in" for the underline.
function watchScroll(header) {
  const links = [...header.querySelectorAll('.nav-links a[href*="#"]')];
  const byId = new Map();
  links.forEach((a) => {
    const id = new URL(a.href, location.origin).hash.slice(1);
    if (id) byId.set(id, a);
  });

  let ticking = false;
  const update = () => {
    ticking = false;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    if (!isHomePath(location.pathname)) return;

    // sections that exist on this page, in page order
    const sections = [...byId.keys()]
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    if (!sections.length) return;

    const line = window.innerHeight * 0.4;
    let current = sections[0].id;
    for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s.id;
    byId.forEach((a, id) => {
      if (id === current) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

export function mountNavbar() {
  let header = document.getElementById("navbar");
  if (!header) {
    header = document.createElement("header");
    header.id = "navbar";
    document.body.prepend(header);
  }

  const inner = document.createElement("nav");
  inner.className = "nav-inner";
  inner.setAttribute("aria-label", "Main");

  const brand = document.createElement("a");
  brand.className = "nav-brand";
  brand.href = "/";
  brand.setAttribute("aria-label", "Lusion AI home");
  // The logo is the same wordmark as the hero sub heading (text + mascot face as the "o")
  const word = document.createElement("span");
  word.className = "nav-wordmark lusion-wordmark";
  word.innerHTML = lusionWordmark();
  brand.append(word);

  const toggle = document.createElement("button");
  toggle.className = "nav-toggle";
  toggle.type = "button";
  toggle.textContent = "Menu";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "nav-links");

  const list = document.createElement("ul");
  list.className = "nav-links";
  list.id = "nav-links";
  NAV_LINKS.forEach((l) => list.append(makeLink(l)));
  list.append(makeLink(NAV_CTA, "nav-cta"));

  const closeMenu = () => {
    header.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const open = header.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  list.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    closeMenu();
    // On the home page, in-page links scroll smoothly instead of reloading
    const url = new URL(a.href, location.origin);
    if (url.hash && isHomePath(url.pathname) && isHomePath(location.pathname)) {
      const target = document.getElementById(url.hash.slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", url.hash);
      }
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("open")) {
      closeMenu();
      toggle.focus();
    }
  });

  inner.append(brand, toggle, list);
  header.replaceChildren(inner);
  watchScroll(header);
}