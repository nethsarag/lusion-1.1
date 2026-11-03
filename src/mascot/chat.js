import { ask, parseInline, WELCOME } from "./brain.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// The chat panel that opens above the docked mascot.
export class Chat {
  constructor({ mascot }) {
    this.mascot = mascot;
    this.isOpen = false;
    this.busy = false;
    this.started = false;
    this.build();

    mascot.onModeChange = (mode) => {
      if (mode === "hero" && this.isOpen) this.close(false);
    };
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.close(true);
    });
  }

  build() {
    const el = document.createElement("aside");
    el.className = "mascot-chat";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Chat with Lusion AI");
    el.inert = true;
    el.innerHTML = `
      <header class="chat-head">
        <div>
          <strong>Lusion AI</strong>
          <span>Demo helper &middot; answers from the project guide</span>
        </div>
        <button class="chat-close" type="button" data-glass-size="icon" aria-label="Close chat">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>
        </button>
      </header>
      <div class="chat-log" role="log" aria-live="polite" aria-label="Conversation"></div>
      <div class="chat-chips"></div>
      <form class="chat-form" autocomplete="off">
        <label class="sr" for="chat-input">Your message</label>
        <input id="chat-input" name="message" type="text" placeholder="Ask about scoring, filming, pricing..." maxlength="300" />
        <button class="btn-primary" type="submit" data-glass-size="sm">Send</button>
      </form>`;
    document.body.append(el);

    this.el = el;
    this.log = el.querySelector(".chat-log");
    this.chips = el.querySelector(".chat-chips");
    this.form = el.querySelector(".chat-form");
    this.input = el.querySelector("#chat-input");

    el.querySelector(".chat-close").addEventListener("click", () => this.close(true));
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = this.input.value.trim();
      if (text) this.send(text);
    });
  }

  // ---- open / close ---------------------------------------------------------
  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.el.inert = false;
    this.el.classList.add("open");
    this.mascot.setChatOpen(true);
    this.mascot.reactNow("wink", 1.1);
    if (!this.started) {
      this.started = true;
      this.botSay(WELCOME);
    }
    setTimeout(() => this.input.focus({ preventScroll: true }), 120);
  }

  close(returnFocus) {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.el.classList.remove("open");
    this.el.inert = true;
    this.mascot.setChatOpen(false);
    if (returnFocus) this.mascot.focus();
  }

  toggle() {
    this.isOpen ? this.close(true) : this.open();
  }

  // ---- messages ---------------------------------------------------------------
  scroll() {
    this.log.scrollTop = this.log.scrollHeight;
  }

  userSay(text) {
    const b = document.createElement("div");
    b.className = "chat-msg user";
    b.textContent = text;
    this.log.append(b);
    this.scroll();
  }

  showChips(list = []) {
    this.chips.replaceChildren();
    for (const label of list) {
      const c = document.createElement("button");
      c.type = "button";
      c.textContent = label;
      c.dataset.glassSize = "sm";
      c.addEventListener("click", () => this.send(label));
      this.chips.append(c);
    }
  }

  async send(text) {
    if (this.busy) return;
    this.busy = true;
    this.input.value = "";
    this.showChips([]);
    this.userSay(text);

    // "thinking": typing dots + the mascot looks up and sways its moustache
    const dots = document.createElement("div");
    dots.className = "chat-msg bot typing";
    dots.setAttribute("aria-label", "Lusion is typing");
    dots.innerHTML = "<i></i><i></i><i></i>";
    this.log.append(dots);
    this.scroll();
    this.mascot.setMood("thinking");

    const [reply] = await Promise.all([ask(text), wait(reduceMotion.matches ? 150 : 650 + Math.random() * 500)]);
    dots.remove();
    await this.botSay(reply);
    this.busy = false;
  }

  // Types the reply word by word while the mascot "talks"
  async botSay(reply) {
    const bubble = document.createElement("div");
    bubble.className = "chat-msg bot";
    this.log.append(bubble);
    this.mascot.setMood("talking");
    this.log.setAttribute("aria-busy", "true");

    const instant = reduceMotion.matches;
    for (const line of reply.text.split("\n")) {
      const p = document.createElement("p");
      bubble.append(p);
      for (const part of parseInline(line)) {
        if (part.href) {
          const a = document.createElement("a");
          a.href = part.href;
          a.textContent = part.text;
          p.append(a);
          this.scroll();
          if (!instant) await wait(40);
          continue;
        }
        for (const w of part.text.split(/(\s+)/)) {
          if (!w) continue;
          p.append(document.createTextNode(w));
          if (!instant && w.trim()) {
            this.scroll();
            await wait(26);
          }
        }
      }
    }
    this.log.removeAttribute("aria-busy");
    this.scroll();
    this.mascot.setMood(null);
    this.mascot.react(reply.mood || "happy", 1.8);
    this.showChips(reply.chips);
  }
}
