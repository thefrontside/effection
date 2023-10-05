import { serve } from "freejack/server.ts";
import { html } from "freejack/html.ts";
import { render } from "freejack/view.ts";
import { Docs, loadDocs, useDocs } from "./docs/docs.ts";
import { useV2Docs } from "./hooks/use-v2-docs.ts";

import { AppHtml, DocumentHtml, IndexHtml } from "./html/templates.ts";

export default function* start() {
  let v2docs = yield* useV2Docs({
    fetchEagerly: !!Deno.env.get("V2_DOCS_FETCH_EAGERLY"),
    revision: 3,
  });

  let docs = yield* loadDocs();
  yield* Docs.set(docs);

  return yield* serve({
    "/": html.get(function* () {
      return yield* render(
        AppHtml({ title: "Effection" }),
        IndexHtml(),
      );
    }),

    "/docs/:id": html.get(function* ({ id }) {
      let docs = yield* useDocs();

      let doc = docs.getDoc(id);

      if (!doc) {
        return { name: "h1", attrs: {}, children: ["Not Found"] };
      }

      return yield* render(
        AppHtml({ title: `${doc.title} | Effection` }),
        DocumentHtml(doc),
      );
    }),

    "/V2": v2docs.serveWebsite,
    "/V2/*path": v2docs.serveWebsite,
    "/V2/api": v2docs.serveApidocs,
    "/V2/api/*path": v2docs.serveApidocs,
  });
}
