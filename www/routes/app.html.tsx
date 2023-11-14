import type { Operation } from "effection";
import type { JSXChild } from "revolution";

import { useAbsoluteUrl } from "../plugins/rebase.ts";
import { ProjectSelect } from "../components/project-select.tsx";

export interface Options {
  title: string;
}

export function* useAppHtml(
  { title }: Options,
): Operation<({ children }: { children: JSXChild }) => JSX.Element> {
  let homeURL = yield* useAbsoluteUrl("/");
  let twitterImageURL = yield* useAbsoluteUrl(
    "/assets/images/meta-effection.png",
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
        <meta
          property="og:url"
          content={homeURL}
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
          content={twitterImageURL}
        />
        <link rel="icon" href="/assets/images/favicon-effection.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="canonical"
          href={homeURL}
        />
        <link
          rel="alternate"
          href={homeURL}
          hreflang="en"
        />
        <link
          rel="alternate"
          href={homeURL}
          hreflang="x-default"
        />
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
                  width="156px"
                  height="24px"
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
                <li class="sm:hidden">
                  <a href="https://github.com/thefrontside/effection">Github</a>
                </li>
                <li class="hidden sm:block">
                  <a href="https://github.com/thefrontside/effection">
                    <IconGithHub />
                  </a>
                </li>
                <li class="sm:hidden">
                  <a href="https://discord.gg/r6AvtnU">Discord</a>
                </li>
                <li class="hidden sm:block">
                  <a href="https://discord.gg/r6AvtnU">
                    <IconDiscord />
                  </a>
                </li>
                <li>
                  <ProjectSelect />
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main>
          {children}
        </main>
        <footer class="grid grid-cols-3 text-center text-gray-500 tracking-wide bg-gray-100 py-10 gap-y-4 leading-10">
          <section class="flex flex-col gap-y-1">
            <h1 class="text-sm uppercase font-bold text-blue-primary mb-4">
              About
            </h1>
            <a class="" href="https://frontside.com" class="text-gray-800">
              Maintained by Frontside <IconExtern />
            </a>
          </section>
          <section class="flex flex-col gap-y-1">
            <h1 class="text-sm uppercase font-bold text-blue-primary mb-4">
              OSS Projects
            </h1>
            <a href="https://frontside.com/interactors" class="text-gray-800">
              Interactors <IconExtern />
            </a>
            <a href="/V2" class="text-gray-800">
              Effection<em class="align-super text-xs">v2</em> <IconExtern />
            </a>
          </section>
          <section class="flex flex-col gap-y-1">
            <h1 class="text-sm uppercase font-bold text-blue-primary mb-4">
              Community
            </h1>
            <a href="https://discord.gg/r6AvtnU" class="text-gray-800">
              Discord <IconExtern />
            </a>
            <a
              href="https://github.com/thefrontside/effection"
              class="text-gray-800"
            >
              GitHub <IconExtern />
            </a>
          </section>
          <p class="col-span-3 text-blue-primary text-xs py-4">
            Copyright © 2019 - {new Date().getFullYear()}{" "}
            The Frontside Software, Inc.
          </p>
        </footer>
      </body>
    </html>
  );
}

const IconExtern = () => (
  <svg
    class="inline"
    width="13.5"
    height="13.5"
    aria-hidden="true"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"
    >
    </path>
  </svg>
);

const IconGithHub = () => (
  <svg
    height="16"
    focusable="false"
    aria-hidden="true"
    role="img"
    viewBox="0 0 16 16"
    fill="currentColor"
    stroke="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z">
    </path>
  </svg>
);

const IconDiscord = () => (
  <svg
    height="16"
    focusable="false"
    aria-hidden="true"
    role="img"
    viewBox="0 0 16 16"
    fill="currentColor"
    stroke="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z">
    </path>
  </svg>
);
