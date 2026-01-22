import { createContext, type Operation } from "effection";
import { createJSRClient, JSRClient } from "../resources/jsr-client.ts";

const JSRClientContext = createContext<JSRClient>("jsr-client");

export function* initJSRClient() {
  let token = Deno.env.get("JSR_API") ?? "";
  if (token === "") {
    console.log("Missing JSR API token; expect score card not to load.");
  }

  let client = yield* createJSRClient(token);

  return yield* JSRClientContext.set(client);
}

export function* useJSRClient(): Operation<JSRClient> {
  return yield* JSRClientContext.expect();
}
