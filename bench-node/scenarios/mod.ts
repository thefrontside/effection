/**
 * Scenario registry.
 *
 * Maps scenario names to their implementations.
 *
 * @module
 */

import type { Scenario } from "./types.ts";

// Import all scenarios
import { effectionRecursion } from "./effection.recursion.ts";
import { effectionEvents } from "./effection.events.ts";
import { effectionInlineRecursion } from "./effection-inline.recursion.ts";
import { asyncAwaitRecursion } from "./async-await.recursion.ts";
import { rxjsRecursion } from "./rxjs.recursion.ts";
import { rxjsEvents } from "./rxjs.events.ts";
import { coRecursion } from "./co.recursion.ts";
import { effectRecursion } from "./effect.recursion.ts";
import { effectEvents } from "./effect.events.ts";
import { effectV4Recursion } from "./effect-v4.recursion.ts";
import { effectV4Events } from "./effect-v4.events.ts";
import { addEventListenerEvents } from "./add-event-listener.events.ts";

/**
 * All registered scenarios.
 */
export const scenarios: Record<string, Scenario> = {
  "effection.recursion": effectionRecursion,
  "effection.events": effectionEvents,
  "effection-inline.recursion": effectionInlineRecursion,
  "async-await.recursion": asyncAwaitRecursion,
  "rxjs.recursion": rxjsRecursion,
  "rxjs.events": rxjsEvents,
  "co.recursion": coRecursion,
  "effect.recursion": effectRecursion,
  "effect.events": effectEvents,
  "effect-v4.recursion": effectV4Recursion,
  "effect-v4.events": effectV4Events,
  "add-event-listener.events": addEventListenerEvents,
};

/**
 * Get a scenario by name.
 */
export function getScenario(name: string): Scenario | undefined {
  return scenarios[name];
}

/**
 * List all available scenario names.
 */
export function listScenarios(): string[] {
  return Object.keys(scenarios);
}
