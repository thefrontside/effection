export default [
  // Recursion benchmarks
  "./scenarios/effection.recursion.ts",
  "./scenarios/rxjs.recursion.ts",
  "./scenarios/co.recursion.ts",
  "./scenarios/async+await.recursion.ts",
  "./scenarios/effect.recursion.ts",
  // Events benchmarks
  "./scenarios/effection.events.ts",
  "./scenarios/rxjs.events.ts",
  "./scenarios/add-event-listener.events.ts",
  "./scenarios/effect.events.ts",
  // Cancellation benchmarks
  "./scenarios/cancellation/effection-structured.cancellation.ts",
  "./scenarios/cancellation/async+abort.cancellation.ts",
  "./scenarios/cancellation/effect.cancellation.ts",
  "./scenarios/cancellation/rxjs.cancellation.ts",
].map((mod) => import.meta.resolve(mod));
