import type { Params, ServeHandler } from "./types.ts";
import type { Operation } from "effection";

import { toHtml } from "npm:hast-util-to-html@9.0.0";

import { twind } from "freejack/twind.ts";
import { BaseUrl, CurrentRequest } from "freejack/view.ts";

export const html = {
  get(operation: (params: Params) => Operation<JSX.Element>): ServeHandler {
    return {
      method: "GET",
      *middleware(params, request) {
        yield* CurrentRequest.set(request);
        let url = new URL(request.url);
        url.pathname = "/";
        yield* BaseUrl.set(url);

        let top = yield* operation(params);

        twind(top);

        let text = `<!DOCTYPE html>${toHtml(top)}<html>`;

        return new Response(text, {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/html",
          },
        });
      },
    };
  },
};
