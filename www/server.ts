import { serve } from "freejack/server.ts";
import { html } from "freejack/html.ts";
import { render } from "freejack/view.ts";
import { Docs, loadDocs, useDocs } from "./docs/docs.ts";

import { AppHtml, DocumentHtml, IndexHtml } from "./html/templates.ts";

export default function* start() {
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
  });
}
