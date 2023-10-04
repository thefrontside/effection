import type { Operation } from "effection";
import type { HttpMethod } from "https://deno.land/std@0.188.0/http/method.ts";

export type Params = Record<string, string>;

export interface ServeHandler {
  method?: HttpMethod;
  middleware: (params: Params, request: Request) => Operation<Response>;
}
