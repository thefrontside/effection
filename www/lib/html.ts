import type { Params, ServeHandler } from "./types.ts";
import type { Operation } from "effection";

import { toHtml } from "https://esm.sh/hast-util-to-html@8.0.4";

import { twind } from "freejack/twind.ts";

export const html = {
  get(operation: (params: Params) => Operation<JSX.Element>): ServeHandler {
    return {
      method: "GET",
      *middleware(params) {
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
