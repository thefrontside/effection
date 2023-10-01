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
        <link
          href="https://fonts.googleapis.com/css?family=Inter&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header class="header w-full top-0 p-6 sticky tracking-wide">
          <div class="flex items-center justify-between">
            <div>
              <a href="/">
                <img
                  src="/assets/images/effection-logo.svg"
                  alt="Effection Logo"
                />
              </a>
            </div>

            <nav aria-label="Site Nav" class="text-sm">
              <ul class="flex items-center gap-6 md:gap-16">
                <NavLink
                  href="https://deno.land/x/effection/mod.ts"
                  text="API Reference"
                />
                <NavLink href="/docs/introduction" text="Guides" />
                <NavLink
                  href="https://github.com/thefrontside/effection"
                  text="Github"
                />
                <NavLink href="https://discord.gg/r6AvtnU" text="Discord" />
              </ul>
            </nav>
          </div>
        </header>
        <main>
          {yield* outlet}
        </main>
        <footer class="grid grid-cols-3 text-center bg-gray-100">
          <section class="flex flex-col">
            <h1>About</h1>
            <a href="https://frontside.com">Maintained by Frontside</a>
          </section>
          <section class="flex flex-col">
            <h1>OSS Projects</h1>
            <a href="https://frontside.com/interactors">Interactors</a>
            <a>Effection</a>
          </section>
          <section class="flex flex-col">
            <h1>Community</h1>
            <a href="https://discord.gg/r6AvtnU">Discord</a>
            <a href="https://github.com/thefrontside/effection">GitHub</a>
          </section>
          <p class="col-span-3">
            Copyright © 2019 - {new Date().getFullYear()}{" "}
            The Frontside Software, Inc.
          </p>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, text }: { href: string; text: string }) {
  return (
    <li>
      <a
        class=" "
        href={href}
      >
        {text}
      </a>
    </li>
  );
}
