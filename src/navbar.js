import "../styles/navbar.css";

// Edit these arrays to change the navbar on every page.
// TODO: replace "#" with real page paths as those pages get built.
export const NAV_LINKS = [
  { label: "Pricing", href: "#" },
  { label: "Resources", href: "#" },
  { label: "About us", href: "#" },
  { label: "Log in", href: "#" },
];
export const NAV_CTA = { label: "Get Started", href: "/session.html" };

// Logo file: public/images/lusion-logo.png
const LOGO_SRC = "/images/lusion-logo.png";

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

  toggle.addEventListener("click", () => {
    const open = header.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  list.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      header.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  inner.append(brand, toggle, list);
  header.replaceChildren(inner);
}