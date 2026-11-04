// The mascot's answers.
//
// This is a small offline helper: it matches keywords and answers from the
// project's own pages and README. Nothing is sent to a server.
//
// To plug in a real AI later, replace the body of `ask()` with a call to your
// backend and return the same shape: { text, chips?, mood? }.
// Use "[label](/path)" in text for links, and "\n" for a new line.

const T = (rx, text, extra = {}) => ({ rx, text, ...extra });

const TOPICS = [
  T(
    [/\bscor\w*/, /\bchecks?\b/, /\bcues?\b/, /\b(rules?|thresholds?)\b/, /\b(form|technique|feedback)\b/, /\bgrad\w*/],
    [
      "Every rep is checked against five rules:",
      "• Setup position: your back angle at the start. Cue: \"Chest higher at the start.\"",
      "• Extension: hip and knee angle at the top of the pull. Cue: \"Finish the extension before pulling under.\"",
      "• Bar close to body: how far your wrists drift from your ankles. Cue: \"Keep the bar close to your body.\"",
      "• Catch depth: hip height against your knee. Cue: \"Sit deeper in the catch.\"",
      "• Lockout: elbow angle overhead. Cue: \"Lock your elbows overhead.\"",
      "You get a score and up to two cues. The bar itself isn't tracked, so your wrists stand in for it. More on the [Resources page](/resources.html).",
    ].join("\n"),
    { chips: ["Filming tips", "How accurate is it?"], mood: "happy" }
  ),
  T(
    [/how (does|do) (it|this|lusion) work/, /\bwhat (is|s) (lusion|this)\b/, /\babout (lusion|this)\b/, /\bpose\b/, /\bmediapipe\b/, /\brep detect\w*/, /\bphases?\b/, /\btrack\w*/],
    "Lusion watches you through your webcam with a pose model that runs in your browser. It follows each snatch rep through Setup, Pull and Catch & stand, then gives you a score and up to two short coaching cues. [Start a session](/session.html) or read [About us](/about.html).",
    { chips: ["How does scoring work?", "Is my video uploaded?"] }
  ),
  T(
    [/\bfilm\w*/, /\bcamera\b/, /\bwebcam\b/, /\bangle\b/, /\bdistance\b/, /\blight\w*/, /\bside(ways| on)?\b/, /\bframe\b/, /\bset ?up\b/],
    [
      "For the best read, film like this:",
      "• Stand sideways to the camera, whole body in frame, head to feet.",
      "• Stay about 2 to 3 m away.",
      "• Use even light and fitted clothing.",
      "• Keep the camera still, at about hip height.",
      "A checklist under the video ticks off as each condition is met. [Open the camera tool](/session.html)",
    ].join("\n"),
    { chips: ["How does scoring work?", "Is my video uploaded?"], mood: "happy" }
  ),
  T(
    [/\bprivacy\b/, /\bupload\w*/, /\b(stored|saved|sent|leave|leaves)\b/, /\b(data|server|backend|recorded?|recording)\b/],
    "Everything runs in your browser. Your video never leaves your device, and there is no backend or video upload. The pose model is loaded from a CDN the first time, but your footage stays with you.",
    { chips: ["How does it work?", "Filming tips"], mood: "soft" }
  ),
  T(
    [/\bpric\w*/, /\bcost\w*/, /\bfree\b/, /\bplans?\b/, /\bsubscri\w*/, /\bpay\w*/],
    "There are two plans, Lifter and Coach. Final prices are still to be confirmed before launch. Have a look at [Pricing](/pricing.html) to see what each plan includes.",
    { chips: ["What do coaches get?", "How do I sign up?"] }
  ),
  T(
    [/\bcoach\w*/, /\bdashboard\b/, /\breferral\b/, /\bguides?\b/, /\blifters?\b/, /\badmin\b/],
    "Coaches get a dashboard for all their lifters, can assign guides and review reports, and have a referral code to bring lifters in. Right now the dashboards show sample data while the real session data is being built. See [Pricing](/pricing.html) for the plan details.",
    { chips: ["Pricing", "How do I sign up?"] }
  ),
  T(
    [/\breplace\b/, /\baccura\w*/, /\blimit\w*/, /\bmedical\b/, /\binjur\w*/, /\bsafe(ty)?\b/, /\bwrong\b/, /\btrust\b/],
    "It's guidance, not a replacement for a qualified coach, and not medical or safety advice. It works best with one person, one camera and a side-on view. It uses 2D pose estimation, so depth and bar path are approximations, and lighting, clothing and framing all affect accuracy.",
    { chips: ["Filming tips", "How does scoring work?"], mood: "soft" }
  ),
  T(
    [/\bclean\b/, /\bjerk\b/, /\bsquat\b/, /\bdeadlift\b/, /\bsnatch\b/, /\blifts?\b/, /\bexercises?\b/, /\bbench\b/],
    "Lusion 1.1 supports the snatch only. Clean & jerk is on the roadmap.",
    { chips: ["What's coming next?", "How does scoring work?"] }
  ),
  T(
    [/\bsign ?up\b/, /\blog ?in\b/, /\baccount\b/, /\bregister\b/, /\bjoin\b/],
    "You can [create an account](/signup.html) as a lifter or a coach, or [log in](/login.html). This is a demo build with no server yet, so any valid details continue to the dashboard.",
    { chips: ["Pricing", "Start a session"] }
  ),
  T(
    [/\bstart\b/, /\btry\b/, /\bbegin\b/, /\bsession\b/, /\bdemo\b/],
    "Let's go. Open the [camera tool](/session.html), allow camera access, stand sideways and get into your setup. I'll be here if you want to talk it through afterwards.",
    { chips: ["Filming tips", "How does scoring work?"], mood: "wink" }
  ),
  T(
    [/\broadmap\b/, /\bfuture\b/, /\bcoming\b/, /\bplanned?\b/, /\bnext\b/, /\bupcoming\b/, /\bsoon\b/, /\bai chat\b/],
    [
      "Here's what's planned:",
      "• Clean & jerk support",
      "• Session saving and comparison with previous sessions",
      "• Lusion AI chat for talking through your session insights",
      "• Accounts, plus coach and member dashboards",
      "I'm an early taste of that chat.",
    ].join("\n"),
    { chips: ["Who are you?", "Which lifts work today?"], mood: "happy" }
  ),
  T(
    [/\bwho are you\b/, /\bwhat are you\b/, /\byour name\b/, /\bmascot\b/, /\bare you (an? )?(ai|bot|real|human)\b/],
    "I'm Lusion's mascot. For now I'm a small helper that answers from the project guide, and nothing you type is sent anywhere. A full AI chat for talking through your session is on the roadmap.",
    { chips: ["What's coming next?", "How does it work?"], mood: "wink" }
  ),
  T([/\bthank\w*/, /\bcheers\b/, /\bawesome\b/, /\bnice\b/], "Anytime! Ask me whatever you like.", { chips: ["Filming tips", "Pricing"], mood: "happy" }),
  T([/\bbye\b/, /\bsee you\b/, /\bcya\b/], "See you at the bar!", { mood: "wink" }),
  T(
    [/\b(hi|hello|hey|hiya|yo|sup)\b/, /good (morning|afternoon|evening)/],
    "Hey! I can explain how the form checks work, how to film yourself, or what's planned next. What would you like to know?",
    { chips: ["How does scoring work?", "Filming tips", "Pricing"], mood: "wink" }
  ),
];

const FALLBACK = {
  text: "I'm not sure about that one yet. I can help with scoring, filming tips, privacy, pricing, coaches and what's planned next.",
  chips: ["How does scoring work?", "Filming tips", "Pricing"],
  mood: "curiousL",
};

export const WELCOME = {
  text: "Hi, I'm Lusion. I can explain how the form checks work, how to film yourself, or what's planned next. I'm a small demo helper for now, so I answer from the project guide.",
  chips: ["How does scoring work?", "Filming tips", "Is my video uploaded?", "Pricing"],
};

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s'&]/g, " ");
}

export async function ask(input) {
  const q = normalize(input);
  let best = null;
  let score = 0;
  for (const t of TOPICS) {
    const s = t.rx.reduce((n, r) => n + (r.test(q) ? 1 : 0), 0);
    if (s > score) {
      best = t;
      score = s;
    }
  }
  return best ? { text: best.text, chips: best.chips, mood: best.mood } : FALLBACK;
}

// "[label](/path)" -> parts. Only same-site links are allowed.
export function parseInline(str) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let i = 0;
  let m;
  while ((m = re.exec(str))) {
    if (m.index > i) out.push({ text: str.slice(i, m.index) });
    const href = m[2];
    out.push(href.startsWith("/") || href.startsWith("#") ? { text: m[1], href } : { text: m[1] });
    i = re.lastIndex;
  }
  if (i < str.length) out.push({ text: str.slice(i) });
  return out;
}
