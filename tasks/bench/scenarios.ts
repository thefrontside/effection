export default [
  "./scenarios/effection.recursion.ts",
  "./scenarios/rxjs.recursion.ts",
  "./scenarios/co.recursion.ts",
  "./scenarios/async+await.recursion.ts",
  "./scenarios/effect.recursion.ts",
  "./scenarios/effection.events.ts",
  "./scenarios/rxjs.events.ts",
  "./scenarios/add-event-listener.events.ts",
  "./scenarios/effect.events.ts",
].map((mod) => import.meta.resolve(mod));
