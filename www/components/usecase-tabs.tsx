import type { JSXElement } from "revolution/jsx-runtime";
import { CodeWindow } from "./code-window.tsx";

interface UseCase {
  tab: string;
  filename: string;
  code: string;
  note: string;
}

const CASES: UseCase[] = [
  {
    tab: "Timeout",
    filename: "timeout.ts",
    code: `function* fetchUser(id) {
  return yield* race([
    fetchJSON(\`/users/\${id}\`),
    sleep(5000),
  ]);
}`,
    note:
      "Nothing here cancels the losing request — you'd reach for an AbortController next. You don't have to. When one branch wins, the other is already halted.",
  },
  {
    tab: "Parallel",
    filename: "parallel.ts",
    code: `function* loadDashboard() {
  const [user, feed, prefs] = yield* all([
    fetchUser(),
    fetchFeed(),
    fetchPrefs(),
  ]);
  return { user, feed, prefs };
}`,
    note:
      "Promise.all rejects on the first failure but lets the other requests finish anyway. Here, one failure halts the siblings — no orphaned work.",
  },
  {
    tab: "Stream",
    filename: "stream.ts",
    code: `function* listen(socket) {
  for (const message of yield* each(socket)) {
    yield* handle(message);
    yield* each.next();
  }
}`,
    note:
      "No socket.close(), no removeEventListener. Leave the loop — return, throw, or cancel — and the subscription closes itself.",
  },
  {
    tab: "Background",
    filename: "background.ts",
    code: `function* entrypoint() {
  yield* spawn(heartbeat);
  yield* serveRequests();
}`,
    note:
      "heartbeat runs for as long as entrypoint does. No handle to keep, no teardown to write — when entrypoint returns or is cancelled, it's halted with it.",
  },
  {
    tab: "Async teardown",
    filename: "database.ts",
    code: `function* report() {
  const db = yield* resource(function* (provide) {
    const conn = yield* connect(DATABASE_URL);
    yield* ensure(() => conn.close());
    yield* provide(conn);
  });
  return yield* runQueries(db);
}`,
    note:
      "conn.close() is async — an await inside a plain finally is exactly what gets abandoned on cancel. The resource's teardown runs to completion when report() exits, every time.",
  },
];

/**
 * UseCaseTabs — five real Effection use cases that each look too simple to be
 * correct. CSS-only tabs (the site's radio/checkbox-hack convention, no JS): a
 * hidden radio per case drives which pill is active and which panel shows,
 * via `:checked ~` sibling selectors in a scoped <style> block.
 */
export function UseCaseTabs(): JSXElement {
  let ACCENT = "#14315D";
  let css =
    CASES.map((_, i) =>
      `#uc-tab-${i}:checked~.uc-tablist label[for="uc-tab-${i}"]{color:#fff!important;border-color:transparent!important;background-color:${ACCENT}!important;}` +
      `#uc-tab-${i}:checked~.uc-panels .uc-p${i}{display:block}`
    ).join("\n") +
    "\n.uc-panel{display:none}.uc-panel{animation:ucfade .25s ease}" +
    "@keyframes ucfade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}";

  return (
    <div class="uc-tabs mx-auto max-w-[680px]">
      <>
        {CASES.map((_, i) => (
          <input
            class="hidden"
            type="radio"
            name="uc-tabs"
            id={`uc-tab-${i}`}
            checked={i === 0}
          />
        ))}
      </>
      <div class="uc-tablist mb-5 flex flex-wrap justify-center gap-1.5">
        {CASES.map((c, i) => (
          <label
            for={`uc-tab-${i}`}
            class="cursor-pointer rounded-full border-2 border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition-colors hover:border-[#26ABE8] hover:text-[#14315D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-[#26ABE8]"
          >
            {c.tab}
          </label>
        ))}
      </div>
      <div class="uc-panels">
        {CASES.map((c, i) => (
          <div class={`uc-panel uc-p${i}`}>
            <CodeWindow filename={c.filename} code={c.code} />
            <p class="mx-auto mt-4 max-w-lg text-center text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
              {c.note}
            </p>
          </div>
        ))}
      </div>
      <style>{css}</style>
    </div>
  );
}
