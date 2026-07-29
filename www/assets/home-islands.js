// Home page interactivity — vanilla JS, no framework.
// Drives (1) the OperationTree halt↓/teardown↑ cascade and (2) the install
// command copy button. Both no-op gracefully when their DOM isn't present.

const NAVY = "#14315d";
const GREEN = "#16a34a";
const AMBER = "#b45309";
const IDLE_EDGE = "#cbd5e1";

function initOperationTree() {
  let root = document.getElementById("operation-tree");
  let btn = document.getElementById("operation-tree-halt");
  if (!root || !btn) return;

  let nodes = Array.from(root.querySelectorAll("[data-node]"));
  let edges = Array.from(root.querySelectorAll("[data-edge]"));
  let state = {}; // id -> "halting" | "done"
  let timers = [];
  let phase = "alive"; // "alive" | "running" | "torndown"

  function nodeFill(st) {
    if (st === "done") return "#fffbeb";
    if (st === "halting") return "#f0fdf4";
    return "#fff";
  }
  function nodeStroke(st) {
    if (st === "done") return AMBER;
    if (st === "halting") return GREEN;
    return NAVY;
  }
  function edgeColor(st) {
    if (st === "done") return AMBER;
    if (st === "halting") return GREEN;
    return IDLE_EDGE;
  }

  function render() {
    for (let g of nodes) {
      let st = state[g.getAttribute("data-node")];
      let rect = g.querySelector("[data-rect]");
      let label = g.querySelector("[data-label]");
      let done = g.querySelector("[data-done-label]");
      if (rect) {
        rect.setAttribute("fill", nodeFill(st));
        rect.setAttribute("stroke", nodeStroke(st));
      }
      if (label) label.setAttribute("fill", st === "done" ? AMBER : NAVY);
      if (done) done.setAttribute("opacity", st === "done" ? "1" : "0");
      g.setAttribute("opacity", st === "done" ? "0.7" : "1");
    }
    for (let line of edges) {
      line.setAttribute(
        "stroke",
        edgeColor(state[line.getAttribute("data-child")]),
      );
    }
  }

  // Rebuild the tree back to its living state; the same button then halts again.
  function revive() {
    timers.forEach(clearTimeout);
    timers = [];
    state = {};
    phase = "alive";
    btn.textContent = "entrypoint.halt()";
    render();
  }

  function halt() {
    phase = "running";
    btn.disabled = true;

    // 1) halt signal propagates DOWN the tree, fast, reaching every operation
    let haltAt = {
      main: 450,
      server: 850,
      watch: 850,
      sock: 1250,
      db: 1250,
      fs: 1250,
    };
    // 2) teardown COMPLETES bottom-up, independently per branch: a parent
    //    only completes once ALL of its own children have
    let doneAt = {
      sock: 2150,
      db: 2650,
      fs: 2350,
      server: 3500,
      watch: 3150,
      main: 4300,
    };

    for (let [id, t] of Object.entries(haltAt)) {
      timers.push(setTimeout(() => {
        if (state[id] !== "done") state[id] = "halting";
        render();
      }, t));
    }
    for (let [id, t] of Object.entries(doneAt)) {
      timers.push(setTimeout(() => {
        state[id] = "done";
        render();
      }, t));
    }
    // The tree is fully torn down: the same button now revives it.
    timers.push(setTimeout(() => {
      phase = "torndown";
      btn.textContent = "entrypoint()";
      btn.disabled = false;
    }, 4700));
  }

  btn.addEventListener("click", () => {
    if (phase === "alive") halt();
    else if (phase === "torndown") revive();
    // ignore clicks while "running" (button is disabled anyway)
  });
}

function initCopyButtons() {
  for (let btn of document.querySelectorAll("[data-copy]")) {
    btn.addEventListener("click", async () => {
      let text = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) { /* clipboard unavailable */ }
      let label = btn.querySelector("[data-copy-label]") || btn;
      let prev = label.textContent;
      label.textContent = "copied";
      btn.setAttribute("data-copied", "1");
      setTimeout(() => {
        label.textContent = prev;
        btn.removeAttribute("data-copied");
      }, 1400);
    });
  }
}

initOperationTree();
initCopyButtons();
