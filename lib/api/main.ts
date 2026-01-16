import { createApi } from "../api.ts";
import type { Api, Operation } from "../types.ts";

export interface Main {
  main: (body: (args: string[]) => Operation<void>) => Promise<void>;
}

export default createApi("Main", {
  main() {
    throw new TypeError(`unhandled api main()`);
  },
}) as Api<Main>;
