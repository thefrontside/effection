import { action } from "./action.ts";
import type { Operation } from "./types.ts";

export function suspend(): Operation<void> {
  return action(() => () => {}, "suspend");
}
