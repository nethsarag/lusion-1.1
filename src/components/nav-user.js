import { ANNOUNCEMENTS } from "../dashboard/config.js";
import { clearUser } from "../dashboard/store.js";

// Navbar items for a logged-in user: Home, Dashboard, Announcements and the username pill.
// navbar.js calls buildUserItems(list, user, makeLink) instead of the public links when a user is stored.

const DASHBOARDS = { lifter: "/lifter.html", coach: "/coach.html", admin: "/admin.html" };
const SEEN_KEY = "lusion-announcements-seen";

const seenIds = () => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
  } catch {
    return [];
  }
};

const BELL = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#ffd633" stroke="#0b0b0b" stroke-width="1.2" stroke-linejoin="round" d="M12 3a6 6 0 0 0-6 6v3.6L4.2 16a1 1 0 0 0 .9 1.5h13.8a1 1 0 0 0 .9-1.5L18 12.6V9a6 6 0 0 0-6-6Zm-2 15.2a2 2 0 0 0 4 0Z"/></svg>`;

// closes `panel` on outside click or Escape
function popover(trigger, panel) {
  const set = (open) => {
    panel.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
  };
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    set(panel.hidden);
  });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target)) set(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      set(false);
      trigger.focus();
    }
  });
  return set;
}

function announcements() {
  const li = document.createElement("li");
  li.className = "nav-item-announce";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-announce";
  btn.dataset.glass = "off"; // outlined pill from the design, not a glass button
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-haspopup", "true");
  btn.innerHTML = `Announcements<span class="nav-bell">${BELL}<span class="nav-badge" hidden></span></span>`;
  const badge = btn.querySelector(".nav-badge");

  const refresh = () => {
    const unseen = ANNOUNCEMENTS.filter((a) => !seenIds().includes(a.id)).length;
    badge.hidden = unseen === 0;
    badge.textContent = unseen;
  };

  const panel = document.createElement("div");
  panel.className = "nav-popover nav-popover--announce";
  panel.hidden = true;
  panel.innerHTML = ANNOUNCEMENTS.length
    ? ANNOUNCEMENTS.map((a) => `<div class="nav-note"><strong>${a.title}</strong><span>${a.body}</span></div>`).join("")
    : `<p class="nav-note">Nothing new.</p>`;

  const set = popover(btn, panel);
  btn.addEventListener("click", () => {
    if (!panel.hidden) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(ANNOUNCEMENTS.map((a) => a.id))); // opening marks them read
      refresh();
    }
  });
  refresh();
  li.append(btn, panel);
  return li;
}

function userPill(user) {
  const li = document.createElement("li");
  li.className = "nav-item-user";

  // .nav-cta makes it the same yellow glass button as "Get Started"
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-cta nav-user";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-haspopup", "true");
  const avatar = document.createElement("span");
  avatar.className = "nav-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = (user.name || "A").trim().charAt(0).toUpperCase();
  const name = document.createElement("span");
  name.className = "nav-username";
  name.textContent = user.name || "Athlete";
  btn.append(avatar, name);

  const panel = document.createElement("div");
  panel.className = "nav-popover nav-popover--user";
  panel.hidden = true;
  const email = document.createElement("p");
  email.className = "nav-note";
  email.textContent = user.email || "";
  const out = document.createElement("button");
  out.type = "button";
  out.className = "nav-menu-item";
  out.dataset.glass = "off";
  out.textContent = "Log out";
  out.addEventListener("click", () => {
    clearUser();
    location.href = "/";
  });
  panel.append(email, out);

  popover(btn, panel);
  li.append(btn, panel);
  return li;
}

export function buildUserItems(list, user, makeLink) {
  list.classList.add("is-user");
  list.append(
    makeLink({ label: "Home", href: "/" }),
    makeLink({ label: "Dashboard", href: DASHBOARDS[user.role] || "/lifter.html" }),
    announcements(),
    userPill(user)
  );
}