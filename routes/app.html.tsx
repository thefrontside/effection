import type { Operation } from "effection";
import type { JSXChild } from "revolution";

import { Footer } from "../components/footer.tsx";
import { Header } from "../components/header.tsx";
import { useAbsoluteUrl } from "../plugins/rebase.ts";

export interface Options {
  title: string;
  description: string;
}

export interface AppHtmlProps {
  children: JSXChild;
  search?: boolean;
}

export function* useAppHtml({
  title,
  description,
}: Options): Operation<({ children, search }: AppHtmlProps) => JSX.Element> {
  let twitterImageURL = yield* useAbsoluteUrl(
    "/assets/images/meta-effection.png",
  );
  let homeURL = yield* useAbsoluteUrl("/");
  
  const header = yield* Header();

  return ({ children, search }) => (
    <html lang="en-US" dir="ltr">
      <head>
        <meta charset="UTF-8" />
        <title>{title}</title>
        <meta property="og:image" content="/assets/images/meta-effection.png" />
        <meta property="og:title" content={title} data-rh="true" />
        <meta property="og:url" content={homeURL} />
        <meta property="og:description" content={description} />
        <meta name="description" content={description} />
        <meta name="twitter:image" content={twitterImageURL} />
        <link rel="icon" href="/assets/images/favicon-effection.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href={homeURL} />
        <link rel="alternate" href={homeURL} hreflang="en" />
        <link rel="alternate" href={homeURL} hreflang="x-default" />
        <link
          href="/assets/prism-atom-one-dark.css"
          rel="preload"
          as="style"
          // @ts-expect-error Property 'onload' does not exist on type 'HTMLLink'.deno-ts(2322)
          onload="this.rel='stylesheet'"
        />
        <link
          href="https://use.typekit.net/ugs0ewy.css"
          rel="preload"
          as="style"
          // @ts-expect-error Property 'onload' does not exist on type 'HTMLLink'.deno-ts(2322)
          onload="this.rel='stylesheet'"
        />
        <noscript>
          <link rel="stylesheet" href="https://use.typekit.net/ugs0ewy.css" />
          <link rel="stylesheet" href="/assets/prism-atom-one-dark.css" />
        </noscript>
        <link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
        <script src="/pagefind/pagefind-ui.js"></script>
      </head>
      <body class="flex flex-col">
        {header}
        <main
          data-pagefind-body={search}
          class="container max-w-screen-2xl mx-auto mb-auto p-5"
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
