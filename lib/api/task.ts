import { createApi } from "../api.ts";
import type { Operation } from "../types.ts";

export default createApi("Task", {
  run: <T>(operation: Operation<T>): Operation<T> => operation,
});
