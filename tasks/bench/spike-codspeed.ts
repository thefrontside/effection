import { Bench } from "npm:tinybench@4";
import { withCodSpeed } from "npm:@codspeed/tinybench-plugin@5.5.0";

const bench = withCodSpeed(new Bench({ time: 50 }));

bench.add("spike.noop", () => {
  let x = 0;
  for (let i = 0; i < 1000; i++) x += i;
  return x;
});

await bench.run();
console.table(bench.table());
console.log("OK: withCodSpeed + tinybench loaded under Deno");
