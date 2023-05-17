import AppHtml from "./html/app.html.tsx";
import IndexHtml from "./html/index.html.tsx";
import DocumentHtml from "./html/document.html.tsx";

export default [AppHtml, {
  "/": IndexHtml,
  "/docs/:id": DocumentHtml,
}] as const;
