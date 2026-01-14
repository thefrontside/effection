import { createApi } from "../api.ts";
import type { Api, Operation } from "../types.ts";

export interface TaskApi {
  run: <T>(operation: () => Operation<T>) => Operation<T>;
  halt: (operation: () => Operation<void>) => Operation<void>;
}

export default createApi("Task", {
  run: (operation) => operation(),
  halt: (operation) => operation(),
}) as Api<TaskApi>;
