import type { HTTPMiddleware } from "revolution";
import type { V2Docs } from "../docs/v2-docs.ts";

import { call } from "effection";
import { concat, route } from "revolution";
import { serveTar } from "./serve-tar.ts";

export function v2docsRoute(v2docs: V2Docs): HTTPMiddleware {
  let { apidocs, website } = v2docs;

  return concat(
    route("/V2/api(.*)", function* (request) {
      return yield* call(serveTar(request, {
        tarRoot: "api/v2",
        urlRoot: "V2/api",
        entries: yield* apidocs,
      }));
    }),
    route("/V2(.*)", function* (request) {
      return yield* call(serveTar(request, {
        tarRoot: "site",
        urlRoot: "V2",
        entries: yield* request.headers.has("X-Base-Url")
          ? website.prod
          : website.local,
      }));
    }),
  );
}
