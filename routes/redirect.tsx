import { useAppHtml } from "./app.html.tsx";

/**
 * Redirect using HTML
 * @param req
 * @param to
 * @returns
 */
export function* softRedirect(req: Request, to: string) {
  const url = new URL(to, new URL(req.url).origin);

  let AppHtml = yield* useAppHtml({
    title: `Redirect to ${to} | Effection`,
    description: `Redirect ${to}`,
    hasLeftSidebar: true,
    head: <meta http-equiv="refresh" content={`0; url=${url.toString().replace(url.origin, "")}`} />,
  });

  return (
    <AppHtml search={false}>
      <p>
        <a href={to}>Redirecting to ${to}</a>
      </p>
    </AppHtml>
  );
}
