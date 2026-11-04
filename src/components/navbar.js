import "../styles/navbar.css";

// Order follows the design: Home, Pricing, Features, About us, Log in, Get Started.
// (resources.html still exists; add { label: "Resources", href: "/resources.html" } to bring it back.)
// Edit these arrays to change the navbar on every page.
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing.html" },
  { label: "Features", href: "/#how" },
  { label: "About us", href: "/about.html" },
  { label: "Log in", href: "/login.html" },
];
export const NAV_CTA = { label: "Get Started", href: "/signup.html" };

// Logo file: public/images/logo.svg
const LOGO_SRC = "/images/logo.svg";

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
  const logo = document.createElement("img");
  logo.className = "nav-logo";
  logo.src = LOGO_SRC;
  logo.alt = "Lusion AI";
  logo.decoding = "async";
  // If the logo file is missing, show a text wordmark instead of a broken image
  logo.addEventListener(
    "error",
    () => {
      const word = document.createElement("span");
      word.className = "nav-wordmark";
      word.textContent = "Lusion AI";
      logo.replaceWith(word);
    },
    { once: true }
  );
  brand.append(logo);

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
    if (e.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("open")) {
      closeMenu();
      toggle.focus();
    }
  });

  inner.append(brand, toggle, list);
  header.replaceChildren(inner);
}