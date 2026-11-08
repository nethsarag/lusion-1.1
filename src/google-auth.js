// Google sign-in for the Login and Get Started pages.
//
// Flow: the existing "Continue with Google" button (#google-btn) opens Google's
// popup (Google Identity Services token client). Google returns an access token,
// and we ask Google itself for the profile (userinfo endpoint), so the name and
// email come straight from Google instead of a token we decoded ourselves.
//
// Setup: see README "Google sign-in". Needs VITE_GOOGLE_CLIENT_ID in the .env file
// in the project ROOT (next to package.json), and the page's origin listed under
// "Authorized JavaScript origins" for that client in Google Cloud Console.
import { setUser } from "./dashboard/store.js";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DASHBOARDS = { lifter: "/lifter.html", coach: "/coach.html" };
// Admin accounts are never created through Google sign-in.
const GOOGLE_ROLES = ["lifter", "coach"];

const btn = document.getElementById("google-btn");
const errorEl = document.getElementById("form-error");
const roleEl = document.getElementById("role");

// Other scripts (the signup mascot) listen for this to react.
function report(ok, message = "") {
  if (errorEl) errorEl.textContent = ok ? "" : message;
  document.dispatchEvent(new CustomEvent("auth:result", { detail: { ok, message } }));
}

function setBusy(busy) {
  if (!btn) return;
  btn.disabled = busy;
  btn.setAttribute("aria-busy", String(busy));
}

// Google's script is loaded with `async`, so wait for it (give up after ~10 s).
function whenGoogleReady(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error("Google sign-in could not load. Check your connection or ad blocker."));
      setTimeout(check, 100);
    })();
  });
}

async function fetchProfile(accessToken) {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Google did not return your profile. Try again.");
  return res.json();
}

function finish(profile) {
  if (!profile.email || profile.email_verified === false) {
    return report(false, "Your Google email is not verified.");
  }
  const picked = roleEl?.value;
  const role = GOOGLE_ROLES.includes(picked) ? picked : "lifter";
  setUser({
    name: profile.given_name || profile.name || profile.email.split("@")[0],
    email: profile.email,
    role,
    picture: profile.picture,
    provider: "google",
  });
  report(true);
  // short pause so the signup mascot can cheer
  setTimeout(() => (location.href = DASHBOARDS[role]), 700);
}

let tokenClient = null;

async function signIn() {
  if (!CLIENT_ID) {
    return report(false, "Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).");
  }
  if (roleEl && !GOOGLE_ROLES.includes(roleEl.value)) {
    return report(false, "Google sign-in is for athletes and coaches. Admins use email and password.");
  }
  report(true); // clear any old error
  setBusy(true);
  try {
    await whenGoogleReady();
    // Create the client lazily, then reuse it. The callbacks run once per popup.
    tokenClient ??= google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "openid email profile",
      callback: async (resp) => {
        try {
          if (resp.error) throw new Error("Google sign-in was cancelled.");
          finish(await fetchProfile(resp.access_token));
        } catch (err) {
          report(false, err.message);
        } finally {
          setBusy(false);
        }
      },
      error_callback: (err) => {
        // popup closed by the user, or blocked by the browser
        setBusy(false);
        report(false, err?.type === "popup_failed_to_open" ? "The Google popup was blocked. Allow popups and try again." : "Google sign-in was cancelled.");
      },
    });
    tokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (err) {
    setBusy(false);
    report(false, err.message);
  }
}

btn?.addEventListener("click", signIn);