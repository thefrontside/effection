import { Bench } from "tinybench";
import { withCodSpeed } from "@codspeed/tinybench-plugin";
import { call, type Operation, run } from "effection";

function* recurse(depth: number): Operation<void> {
  if (depth > 1) {
    yield* recurse(depth - 1);
  } else {
    for (let i = 0; i < 100; i++) {
      yield* call(() => Promise.resolve());
    }
  }
}

const bench = withCodSpeed(new Bench());

bench.add("effection.recursion", async () => {
  await run(() => recurse(100));
});

await bench.run();
console.table(bench.table());
