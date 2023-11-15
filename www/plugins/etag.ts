import { RevolutionPlugin } from "revolution";
import { encodeBase64 } from "https://deno.land/std@0.206.0/encoding/base64.ts";

const DEPLOYMENT_ID =
  // The same deployment will be shared by the many isolates that serve it
  // but because pages do not change, we can use this id as the ETAG
  Deno.env.get("DENO_DEPLOYMENT_ID") ||
  // For local development, just create a new id every time the module is
  // reloaded i.e. whenever the dev server restarts.
  crypto.randomUUID();

const DEPLOYMENT_ID_HASH = await crypto.subtle.digest(
  "SHA-1",
  new TextEncoder().encode(DEPLOYMENT_ID),
);

const ETAG = `"${encodeBase64(DEPLOYMENT_ID_HASH)}"`;
const WEAK_ETAG = `W/"${encodeBase64(DEPLOYMENT_ID_HASH)}"`;

export function etagPlugin(): RevolutionPlugin {
  return {
    *http(request, next) {
      let ifNoneMatch = request.headers.get("if-none-match");
      if (ifNoneMatch === ETAG || ifNoneMatch === WEAK_ETAG) {
        return new Response(null, {
          status: 304,
          statusText: "Not Modified",
        });
      } else {
        let response = yield* next(request);
        if (!response.headers.get("etag")) {
          let tagged = new Response(response.body, response);
          tagged.headers.set("etag", ETAG);
          return tagged;
        }
        return response;
      }
    },
  };
}
