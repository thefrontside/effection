import type { Operation } from "effection";
import type { JSXChild } from "revolution";

import { useAbsoluteUrl } from "../plugins/rebase.ts";
import { ProjectSelect } from "../components/project-select.tsx";
import { IconGithHub } from "../components/icons/github.tsx";
import { IconDiscord } from "../components/icons/discord.tsx";

export interface Options {
  title: string;
}

export function* useAppHtml({
  title,
}: Options): Operation<({ children }: { children: JSXChild }) => JSX.Element> {
  let homeURL = yield* useAbsoluteUrl("/");
  let twitterImageURL = yield* useAbsoluteUrl(
    "/assets/images/meta-effection.png"
  );

  return ({ children }) => (
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
        <meta property="og:url" content={homeURL} />
        <meta
          property="og:description"
          content="Effection is a structured concurrency and effects framework for JavaScript."
        />
        <meta
          name="description"
          content="Effection is a structured concurrency and effects framework for JavaScript."
        />
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
          onload="this.rel='stylesheet'"
        />
        <link
          href="https://use.typekit.net/ugs0ewy.css"
          rel="preload"
          as="style"
          onload="this.rel='stylesheet'"
        />
        <noscript>
          <link rel="stylesheet" href="https://use.typekit.net/ugs0ewy.css" />
          <link rel="stylesheet" href="/assets/prism-atom-one-dark.css" />
        </noscript>
      </head>
      <body class="max-w-screen-2xl m-auto">
        <header class="header w-full top-0 p-6 sticky tracking-wide z-10">
          <div class="flex items-center justify-between">
            <div>
              <a
                href="/"
                class="flex items-end gap-x-2 sm:gap-x-1 after:content-['v3'] after:inline after:relative after:top-0 after:text-sm"
              >
                <img
                  src="/assets/images/effection-logo.svg"
                  alt="Effection Logo"
                  width={156}
                  height={24}
                />
              </a>
            </div>
            <nav aria-label="Site Nav" class="text-sm">
              <ul class="flex items-center sm:gap-1.5 gap-3 md:gap-16">
                <li>
                  <a href="/docs/introduction">Guides</a>
                </li>
                <li>
                  <a href="https://deno.land/x/effection/mod.ts">API</a>
                </li>
                <li>
                  <a class="flex flex-row" href="https://github.com/thefrontside/effection">
                    <span class="hidden pr-1 md:inline">
                      <IconGithHub />
                    </span>
                    Github
                  </a>
                </li>
                <li>
                  <a class="flex flex-row" href="https://discord.gg/r6AvtnU">
                    <span class="hidden pr-1 md:inline">
                      <IconDiscord />
                    </span>
                    Discord
                  </a>
                </li>
                <li>
                  <ProjectSelect />
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
