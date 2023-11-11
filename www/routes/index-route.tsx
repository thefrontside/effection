import type { JSXMiddleware } from "revolution";

import { IndexHtml, useAppHtml } from "../html/templates.ts";

export function indexRoute(): JSXMiddleware {
  return function* () {
    let AppHtml = yield* useAppHtml({ title: `Effection` });

    return (
      <AppHtml>
        <IndexHtml />
      </AppHtml>
    );
  };
}
