import { createContext, type Operation } from "effection";
import { createJSRClient, JSRClient } from "../resources/jsr-client.ts";

const JSRClientContext = createContext<JSRClient>("jsr-client");

export function* initJSRClient({ token }: { token: string }) {
  let client = yield* createJSRClient(token);

  return yield* JSRClientContext.set(client);
}

export function* useJSRClient(): Operation<JSRClient> {
  return yield* JSRClientContext.expect();
}
