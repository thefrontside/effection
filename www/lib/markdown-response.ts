/**
 * Responses for the markdown the site serves to agents: the behavioral
 * contract, the guides, and package readmes.
 *
 * `no-cache` rather than a max age because the header only ever reaches a
 * browser talking to the dev server — a static build copies the body and
 * netlify supplies its own — and these documents are rewritten per
 * environment, so a browser must not hold one environment's copy and show it
 * in another. The etag plugin answers the revalidation with a 304.
 */
export function markdown(content: string): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export function notFound(message: string): Response {
  return new Response(`${message}\n`, {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
