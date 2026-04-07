import type { Operation } from "effection";
import type { JSXChild } from "revolution";

import { Footer } from "../components/footer.tsx";
import { Header, type HeaderProps } from "../components/header.tsx";
import { useAbsoluteUrl, useCanonicalUrl } from "../plugins/current-request.ts";
import { JSXElement } from "revolution/jsx-runtime";

export type Options = {
  title: string;
  description: string;
  head?: JSXElement;
  image?: string;
} & HeaderProps;

export interface AppHtmlProps {
  children: JSXChild;
  search?: boolean;
}

export function* useAppHtml({
  title,
  description,
  hasLeftSidebar,
  head,
  image = "/assets/images/meta-effection.png",
}: Options): Operation<({ children, search }: AppHtmlProps) => JSX.Element> {
  let ogImageURL = yield* useAbsoluteUrl(image);

  let canonicalURL = yield* useCanonicalUrl({
    base: "https://frontside.com/effection",
  });

  let header = yield* Header({ hasLeftSidebar });

  return ({ children, search }) => (
    <html lang="en-US" dir="ltr">
      <head>
        <meta charset="UTF-8" />
        <title>{title}</title>
        <meta property="og:image" content={ogImageURL} />
        <meta property="og:title" content={title} data-rh="true" />
        <meta property="og:url" content={canonicalURL} />
        <meta property="og:description" content={description} />
        <meta name="description" content={description} />
        <meta name="twitter:image" content={ogImageURL} />
        <link rel="icon" href="/assets/images/favicon-effection.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href={canonicalURL} />
        <link rel="alternate" href={canonicalURL} hreflang="en" />
        <link rel="alternate" href={canonicalURL} hreflang="x-default" />
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
        <script type="module" src="https://esm.sh/@11ty/is-land@4.0.0" />
        <script type="module" src="/assets/search.js" />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="LLM Documentation"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          href="/blog/feed.xml"
          title="Effection Blog RSS Feed"
        />
        {head ?? <></>}
      </head>
      <body class="flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-200">
        {header}
        <main
          data-pagefind-body={search}
          class="container max-w-screen-2xl mx-auto mb-auto p-5 bg-white dark:bg-gray-900 dark:text-gray-200"
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
