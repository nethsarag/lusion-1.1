// Demo auth: validates the form, then goes to the dashboard for the chosen role.
// Replace the redirect with a real API call when the backend exists.
const form = document.getElementById("auth-form");
const error = document.getElementById("form-error");
const DASHBOARDS = { lifter: "/lifter.html", coach: "/coach.html", admin: "/admin.html" };

// Pages with a mascot (Get Started) listen for this to react
function report(ok, message = "") {
  document.dispatchEvent(new CustomEvent("auth:result", { detail: { ok, message } }));
}
function fail(message) {
  error.textContent = message;
  report(false, message);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const email = String(data.email || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Enter a valid email address.");
  if (String(data.password || "").length < 8) return fail("Password must be at least 8 characters.");
  if (form.elements.confirm && data.confirm !== data.password) return fail("Passwords do not match.");
  if (form.elements.name && form.dataset.next === "signup" && !String(data.name || "").trim()) return fail("Enter your name.");
  error.textContent = "";
  report(true);
  const go = () => (location.href = DASHBOARDS[data.role] || "/lifter.html");
  // a short beat so the mascot can cheer on the sign-up page
  if (form.dataset.next === "signup") setTimeout(go, 900);
  else go();
});