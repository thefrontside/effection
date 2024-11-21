export default [
  "./scenarios/effection.recursion.ts",
  "./scenarios/effection+hoist.recursion.ts",
  "./scenarios/rxjs.recursion.ts",
  "./scenarios/co.recursion.ts",
  "./scenarios/async+await.recursion.ts",
  "./scenarios/effection.events.ts",
  "./scenarios/rxjs.events.ts",
  "./scenarios/add-event-listener.events.ts",
].map((mod) => import.meta.resolve(mod));
