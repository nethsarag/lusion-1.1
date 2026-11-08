// Demo auth: validates the form, then goes to the dashboard for the chosen role.
// Replace the redirect with a real API call when the backend exists.
import { setUser, nameFromEmail } from "./dashboard/store.js";

const form = document.getElementById("auth-form");
const error = document.getElementById("form-error");
const DASHBOARDS = { lifter: "/lifter.html", coach: "/coach.html", admin: "/admin.html" };

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const email = String(data.email || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return (error.textContent = "Enter a valid email address.");
  if (String(data.password || "").length < 8) return (error.textContent = "Password must be at least 8 characters.");
  if (form.dataset.next === "signup" && !String(data.name || "").trim()) return (error.textContent = "Enter your name.");
  error.textContent = "";
  // Remember who is logged in. The navbar and the dashboard read this.
  const role = DASHBOARDS[data.role] ? data.role : "lifter";
  setUser({ name: String(data.name || "").trim() || nameFromEmail(email), email, role });
  location.href = DASHBOARDS[role];
});