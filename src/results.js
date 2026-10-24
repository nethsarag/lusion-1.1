// Results page shown after every completed rep. Detection is paused while it is open.

const $ = (id) => document.getElementById(id);

const LABELS = {
  setup: "Setup position",
  extension: "Extension",
  "bar-close": "Bar close to body",
  depth: "Catch depth",
  lockout: "Lockout",
};

const history = []; // { n, passed, total }
let open = false;
let onNext = null;

export function isResultsOpen() {
  return open;
}

export function hideResults() {
  if (!open) return;
  open = false;
  $("results")?.classList.remove("open");
  onNext?.();
}

export function initResults(nextCallback) {
  onNext = nextCallback;
  $("next-btn")?.addEventListener("click", hideResults);
  document.addEventListener("keydown", (e) => {
    if (open && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      hideResults();
    }
  });
}

function renderHistory() {
  const el = $("history");
  if (!el) return;
  el.innerHTML = history.length
    ? "<h3>Session</h3>" +
      history.map((h) => `Rep ${h.n}: ${h.passed}/${h.total}`).join(" &nbsp;·&nbsp; ")
    : "";
}

export function showResults(repNumber, rep, evaluation) {
  const { checks, topCues } = evaluation;
  const passed = checks.filter((c) => c.pass).length;
  const total = checks.length;
  const ratio = passed / total;

  history.push({ n: repNumber, passed, total });
  renderHistory();

  $("results-title").textContent = `Rep ${repNumber} complete`;

  const score = $("results-score");
  score.textContent = `${passed} / ${total} checks passed`;
  score.className = "score " + (ratio >= 0.8 ? "good" : ratio >= 0.6 ? "mid" : "low");

  $("results-meta").textContent = rep.durationMs
    ? `Lift time: ${(rep.durationMs / 1000).toFixed(1)} s`
    : "";

  $("results-checks").innerHTML = checks
    .map(
      (c) => `
      <div class="check-row">
        <div>
          <div class="name">${c.pass ? "✅" : "❌"} ${LABELS[c.id] ?? c.id}</div>
          ${c.pass ? "" : `<div class="cue">${c.cue}</div>`}
        </div>
        <div class="val">${c.value}</div>
      </div>`
    )
    .join("");

  $("results-cues").innerHTML = topCues.length
    ? `<b>Focus next rep:</b><br>${topCues.join("<br>")}`
    : "<b>Clean rep!</b> Nothing to fix. Keep it consistent.";

  open = true;
  $("results")?.classList.add("open");
  $("next-btn")?.focus();
}