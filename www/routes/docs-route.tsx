import type { JSXMiddleware } from "revolution";
import type { Docs } from "../docs/docs.ts";

import { DocumentHtml, useAppHtml } from "../html/templates.ts";

import { respondNotFound, useParams } from "revolution";

export function docsRoute(docs: Docs): JSXMiddleware {
  return function* () {
    let { id } = yield* useParams<{ id: string }>();

    let doc = yield* docs.getDoc(id);

    if (!doc) {
      return yield* respondNotFound();
    }

    let AppHtml = yield* useAppHtml({ title: `${doc.title} | Effection` });

    return (
      <AppHtml>
        <DocumentHtml doc={doc} />
      </AppHtml>
    );
  };
}
