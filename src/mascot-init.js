import "./styles/mascot.css";
import { Mascot } from "./mascot/mascot.js";
import { Chat } from "./mascot/chat.js";

// Home page: the mascot starts big in #mascot-anchor, then flies to the
// bottom-right corner when you scroll past the hero and becomes the chat.
// On a page without #mascot-anchor it simply lives in the corner.
const mascot = new Mascot({ anchor: document.getElementById("mascot-anchor") });
const chat = new Chat({ mascot });
mascot.onActivate = () => chat.toggle();

// Any element with data-ask="..." opens the chat and asks that question
document.querySelectorAll("[data-ask]").forEach((el) =>
  el.addEventListener("click", () => {
    chat.open();
    chat.send(el.dataset.ask);
  })
);

// Touch screens have no cursor to watch
if (matchMedia("(hover: none)").matches) {
  const hint = document.getElementById("hero-hint");
  if (hint) hint.textContent = "Tap me to say hi. Scroll and I'll wait in the corner.";
}
