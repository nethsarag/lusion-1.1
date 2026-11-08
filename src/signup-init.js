import "./styles/mascot.css";
import { Mascot } from "./mascot/mascot.js";

// Get Started page: the mascot lives in the ring on top of the card and
// reacts to the form (looks at the field you are in, covers its eyes for
// passwords, checks your match, cheers when you pick a role or finish).
const mascot = new Mascot({ anchor: document.getElementById("mascot-anchor"), pinned: true });

const $ = (id) => document.getElementById(id);
const form = $("auth-form");
const card = document.querySelector(".gs-card");
const email = $("email");
const pass = $("password");
const confirm = $("confirm");
const trigger = $("role-trigger");
const list = $("role-list");
const roleInput = $("role");
const roleCurrent = $("role-current");
const options = [...list.querySelectorAll(".gs-option")];
const wrapOf = (el) => el.closest(".glass-button-wrap") || el;

// ---- Greeting ---------------------------------------------------------------
setTimeout(() => mascot.say("Hi! Let's get you set up.", 3200), 900);

// ---- Fields -----------------------------------------------------------------
const validEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());

email.addEventListener("focus", () => {
  mascot.hold(null);
  mascot.lookAtEl(email, 0, 60, "curiousL");
});
email.addEventListener("input", () => {
  // eyes follow the text as it grows
  mascot.lookAtEl(email, Math.min(email.value.length / 28, 1), 60, "curiousL");
  mascot.poke();
});
email.addEventListener("blur", () => {
  mascot.look = null;
  if (validEmail(email.value)) mascot.cheer(1.1);
  else if (email.value) {
    mascot.reactNow("skepticL", 1.2);
    mascot.say("Is that email right?", 2200);
  }
});

for (const field of [pass, confirm]) {
  field.addEventListener("focus", () => {
    mascot.look = null;
    mascot.hold("shy"); // privacy: eyes shut while a password is typed
    mascot.say(field === pass ? "I'm not looking." : "Still not looking.", 1800);
  });
  field.addEventListener("blur", () => {
    mascot.hold(null);
    mascot.reactNow("wide", 0.4);
  });
}

confirm.addEventListener("input", () => {
  mascot.poke();
  if (!confirm.value) return;
  if (confirm.value === pass.value && pass.value.length >= 8) {
    mascot.hold("happy");
  } else {
    mascot.hold("shy");
  }
});
confirm.addEventListener("blur", () => {
  if (!confirm.value) return;
  if (confirm.value === pass.value && pass.value.length >= 8) {
    mascot.cheer(1.2);
    mascot.say("Passwords match!", 1800);
  } else {
    mascot.shake();
    mascot.say("Those passwords differ.", 2200);
  }
});

// ---- Role dropdown ----------------------------------------------------------
function syncOptions() {
  // show only the role that is not selected, like the design
  for (const o of options) wrapOf(o).hidden = o.dataset.value === roleInput.value;
}
function setOpen(open) {
  trigger.setAttribute("aria-expanded", String(open));
  list.hidden = !open;
  if (open) {
    syncOptions();
    mascot.lookAtEl(trigger, 0.5, 3, "wide");
  }
}
trigger.addEventListener("click", () => setOpen(list.hidden));
options.forEach((o) =>
  o.addEventListener("click", () => {
    roleInput.value = o.dataset.value;
    roleCurrent.textContent = o.dataset.label;
    setOpen(false);
    trigger.focus();
    if (o.dataset.value === "coach") {
      mascot.reactNow("smug", 1.6);
      mascot.say("Welcome, coach.", 2200);
    } else {
      mascot.cheer(1.6);
      mascot.say("Let's lift!", 2200);
    }
  })
);
document.addEventListener("click", (e) => {
  if (!list.hidden && !e.target.closest("#role-picker")) setOpen(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !list.hidden) {
    setOpen(false);
    trigger.focus();
  }
});

// ---- Google (sign-in itself is handled by google-auth.js) -------------------------
const google = $("google-btn");
google.addEventListener("pointerenter", () => mascot.reactNow("wink", 1));
google.addEventListener("click", () => mascot.reactNow("thinking", 1.6));

// ---- Submit result (auth.js sends this) --------------------------------------------
document.addEventListener("auth:result", (e) => {
  if (e.detail.ok) {
    mascot.hold(null);
    mascot.cheer(2);
    mascot.say("Welcome to Lusion!", 1600);
  } else {
    mascot.hold(null);
    mascot.shake();
    mascot.say(e.detail.message, 3000);
    card.classList.remove("is-shake");
    void card.offsetWidth; // restart the animation
    card.classList.add("is-shake");
  }
});

// keep the mascot awake while typing anywhere in the form
form.addEventListener("keydown", () => mascot.poke());