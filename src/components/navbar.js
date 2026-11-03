import "../styles/navbar.css";

// Edit these arrays to change the navbar on every page.
// Role-based links (coach, admin) can be added later by filtering this list.
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how" },
  { label: "Form checks", href: "/#checks" },
];
export const NAV_CTA = { label: "Start session", href: "/session.html" };

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
  brand.innerHTML = '<span class="nav-brand-mark" aria-hidden="true"></span>Lusion';

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