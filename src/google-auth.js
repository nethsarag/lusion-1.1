import { setUser } from "./dashboard/store.js";

function decodeJwt(token) {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(escape(atob(b64))));
}

function onGoogle({ credential }) {
  // DEMO ONLY: decoding on the client does not prove who the user is (see step 3)
  const p = decodeJwt(credential);
  setUser({ name: p.given_name || p.name, email: p.email, role: "lifter", picture: p.picture });
  location.href = "/lifter.html";
}

function init() {
  if (!window.google) return setTimeout(init, 200); // script still loading
  google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: onGoogle,
  });
  google.accounts.id.renderButton(document.getElementById("google-signin"), {
    theme: "outline", size: "large", text: "continue_with", width: 320,
  });
}
init();