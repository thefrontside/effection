import { scenario } from "./scenario.ts";
import { each, on, type Operation, sleep, spawn } from "../../../mod.ts";

await scenario("effection.events", start);

export function* start(depth: number): Operation<void> {
  const target = new EventTarget();
  const task = yield* spawn(() => recurse(target, depth));
  for (let i = 0; i < 100; i++) {
    yield* sleep(0);
    target.dispatchEvent(new Event("foo"));
  }
  yield* sleep(0);
  yield* task.halt();
}

function* recurse(target: EventTarget, depth: number): Operation<void> {
  const eventStream = on(target, "foo");
  if (depth > 1) {
    const subTarget = new EventTarget();
    yield* spawn(() => recurse(subTarget, depth - 1));
    for (const _ of yield* each(eventStream)) {
      subTarget.dispatchEvent(new Event("foo"));
      yield* each.next();
    }
  } else {
    for (const _ of yield* each(eventStream)) {
      yield* each.next();
    }
  }
}
