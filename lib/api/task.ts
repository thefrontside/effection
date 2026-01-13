import { createApi } from "../api.ts";
import type { Api, Operation } from "../types.ts";

export interface TaskApi {
  run: <T>(operation: Operation<T>) => Operation<T>;
}

export default createApi("Task", {
  run: <T>(operation: Operation<T>): Operation<T> => operation,
}) as Api<TaskApi>;
