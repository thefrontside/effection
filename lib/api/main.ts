import { createApi } from "../api.ts";
import type { Api, Operation } from "../types.ts";

export interface Main {
  main: (body: (args: string[]) => Operation<void>) => Promise<void>;
}

export default createApi<Main>("Main", {
  main() {
    throw new TypeError(`missing handler for "main()"`);
  },
}) as Api<Main>;
