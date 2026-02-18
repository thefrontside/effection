import type { ScenarioEntry } from "./types.ts";

/**
 * Typed scenario registry.
 * Each entry explicitly declares its kind, avoiding fragile filename-based classification.
 */
const scenarios: ScenarioEntry[] = [
  // Recursion benchmarks
  { path: "./scenarios/effection.recursion.ts", kind: "recursion" },
  { path: "./scenarios/rxjs.recursion.ts", kind: "recursion" },
  { path: "./scenarios/co.recursion.ts", kind: "recursion" },
  { path: "./scenarios/async+await.recursion.ts", kind: "recursion" },
  { path: "./scenarios/effect.recursion.ts", kind: "recursion" },
  // Events benchmarks
  { path: "./scenarios/effection.events.ts", kind: "events" },
  { path: "./scenarios/rxjs.events.ts", kind: "events" },
  { path: "./scenarios/add-event-listener.events.ts", kind: "events" },
  { path: "./scenarios/effect.events.ts", kind: "events" },
  // Cancellation benchmarks
  {
    path: "./scenarios/cancellation/effection-structured.cancellation.ts",
    kind: "cancellation",
  },
  {
    path: "./scenarios/cancellation/async+abort.cancellation.ts",
    kind: "cancellation",
  },
  {
    path: "./scenarios/cancellation/effect.cancellation.ts",
    kind: "cancellation",
  },
  {
    path: "./scenarios/cancellation/rxjs.cancellation.ts",
    kind: "cancellation",
  },
];

export default scenarios.map((entry) => ({
  ...entry,
  path: import.meta.resolve(entry.path),
}));
