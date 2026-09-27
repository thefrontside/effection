import { type Operation, until } from "effection";
import { RevolutionPlugin } from "revolution";
import { encodeBase64 } from "@std/encoding/base64";

export interface EtagOptions {
  /**
   * The same deployment will be shared by the many isolates that serve it but
   * because pages do not change, we can use this id as the ETAG. When it is
   * empty — local development — a new id is created every time the server
   * boots, i.e. whenever the dev server restarts.
   */
  readonly deploymentId: string;
}

export function* etagPlugin(
  { deploymentId }: EtagOptions,
): Operation<RevolutionPlugin> {
  let id = deploymentId === "" ? crypto.randomUUID() : deploymentId;

  let hash = yield* until(
    crypto.subtle.digest("SHA-1", new TextEncoder().encode(id)),
  );

  let ETAG = `"${encodeBase64(hash)}"`;
  let WEAK_ETAG = `W/"${encodeBase64(hash)}"`;

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
