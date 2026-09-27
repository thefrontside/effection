import type { RevolutionPlugin } from "revolution";
import { CurrentRequest } from "../context/request.ts";

export function currentRequestPlugin(): RevolutionPlugin {
  return {
    *http(request, next) {
      yield* CurrentRequest.set(request);
      return yield* next(request);
    },
  };
}
