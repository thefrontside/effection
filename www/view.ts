import AppHtml from "./html/app.html.tsx";
import IndexHtml from "./html/index.html.tsx";
import DocumentHtml from "./html/document.html.tsx";
import APIDocsHtml from "./html/api-docs.html.tsx";
import APIDocsIndexHtml from "./html/api-docs/index.html.tsx";
import APIFunctionHtml from "./html/api-docs/function.html.tsx";
import APITypeHtml from "./html/api-docs/type.html.tsx";

export default [AppHtml, {
  "/": IndexHtml,
  "/docs/:id": DocumentHtml,
  "/api": [APIDocsHtml, {
    "/": APIDocsIndexHtml,
    "/functions/:modname/:name": APIFunctionHtml,
    "/types/:modname/:name": APITypeHtml,
  }],
}] as const;
