import { call } from "../../../mod.ts";
import { scenario } from "./scenario.ts";

await scenario("add-event-listener.events", (depth) => call(() => run(depth)));

export async function run(depth: number): Promise<void> {
  const target = new EventTarget();
  const c = new AbortController();
  const promised = recurse(target, c.signal, depth);
  for (let i = 0; i < 100; i++) {
    await Promise.resolve();
    target.dispatchEvent(new Event("foo"));
  }
  await Promise.resolve();
  c.abort();
  await promised;
}

async function recurse(
  target: EventTarget,
  signal: AbortSignal,
  depth: number,
): Promise<void> {
  let abort: (() => void) | undefined;
  let handler: (() => void) | undefined;
  let resolve: (() => void) | undefined;
  let promise: Promise<void> | undefined;
  function finalize() {
    abort && (signal.removeEventListener("abort", abort), abort = undefined);
    handler &&
      (target.removeEventListener("foo", handler), handler = undefined);
    resolve && (resolve(), resolve = undefined);
  }
  if (depth > 0) {
    const subTarget = new EventTarget();
    const subPromise = recurse(subTarget, signal, depth - 1);
    handler = function handler() {
      subTarget.dispatchEvent(new Event("foo"));
    };
    target.addEventListener("foo", handler);
    await subPromise;
  } else {
    promise = new Promise<void>((r) => resolve = r);
    abort = finalize;
    handler = function handler() {
      //probeMemory("bottom");
    };
    target.addEventListener("foo", handler);
    signal.addEventListener("abort", abort);
    await promise;
  }
}
