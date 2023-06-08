import type { Operation } from "effection";
import { outlet } from "freejack/view.ts";

export interface Options {
  title: string;
}

export default function* AppHtml({ title }: Options): Operation<JSX.Element> {
  return (
    <html lang="en-US" dir="ltr">
      <head>
        <meta charset="UTF-8" />
        <title>{title}</title>
        <meta property="og:image" content="/assets/images/meta-effection.png" />
        <meta
          property="og:title"
          content="Introduction | Effection"
          data-rh="true"
        />
        <meta
          property="og:url"
          content="https://frontside.com/effection/docs/guides/introduction"
        />
        <meta
          property="og:description"
          content="Effection is a structured concurrency and effects framework for JavaScript."
        />
        <meta
          name="description"
          content="Effection is a structured concurrency and effects framework for JavaScript."
        />
        <meta
          name="twitter:image"
          content="/assets/images/meta-effection.png"
        />
        <link rel="icon" href="/assets/images/favicon-effection.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="canonical"
          href="https://frontside.com/effection/docs/guides/introduction"
        />
        <link
          rel="alternate"
          href="https://frontside.com/effection/docs/guides/introduction"
          hreflang="en"
        />
        <link
          rel="alternate"
          href="https://frontside.com/effection/docs/guides/introduction"
          hreflang="x-default"
        />
        <link rel="stylesheet" href="/assets/prism-atom-one-dark.css" />
      </head>
      <body class="mx-auto max-w-screen-xl">
        <header class="bg-white px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <div class="flex-1 md:flex md:items-center md:gap-12">
              <a class="block text-teal-600" href="/">
                <img src="/assets/images/effection-logo.svg" />
              </a>
            </div>

            <div class="md:flex md:items-center md:gap-12">
              <nav aria-label="Site Nav" class="hidden md:block">
                <ul class="flex items-center gap-6 text-sm">
                  <NavLink href="/docs/api" text="API" />
                  <NavLink href="/docs/introduction" text="Guides" />
                  <NavLink
                    href="https://github.com/thefrontside/effection"
                    text="Github"
                  />
                  <NavLink href="https://discord.gg/r6AvtnU" text="Discord" />
                </ul>
              </nav>
            </div>
          </div>
        </header>

        {yield* outlet}
      </body>
    </html>
  );
}

function NavLink({ href, text }: { href: string; text: string }) {
  return (
    <li>
      <a
        class="text-gray-500 transition hover:text-gray-500/75"
        href={href}
      >
        {text}
      </a>
    </li>
  );
}
