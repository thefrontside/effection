import {
  type WalkEntry,
  type WalkOptions,
} from "https://deno.land/std@0.216.0/fs/walk.ts";
import { createContext, type Operation, type Stream, stream } from "effection";

export const WalkContext = createContext<
  (root: string, options?: WalkOptions) => AsyncIterableIterator<WalkEntry>
>("sys.walk");

export function* useWalk(
  root: string,
  options?: WalkOptions,
): Operation<Stream<WalkEntry, unknown>> {
  const walk = yield* WalkContext;
  return stream(walk(root, options));
}
