import type { Operation } from "effection";
import type { JSXChild, JSXElement } from "revolution";

import { useAbsoluteUrl } from "../plugins/rebase.ts";
import { Header } from "../components/header.tsx";
import { Footer } from "../components/footer.tsx";
import { IconDiscord } from "../components/icons/discord.tsx";
import { Navburger } from "../components/navburger.tsx";
import { ProjectSelect } from "../components/project-select.tsx";
import {
  ContribRepositoryContext,
  LibraryRepositoryContext,
} from "../context/repository.ts";
import { StarIcon } from "../components/icons/star.tsx";

export interface Options {
  title: string;
  description: string;
}

export interface AppHtmlProps {
  children: JSXChild;
  search?: boolean
}

export function* useAppHtml({
  title,
  description,
}: Options): Operation<({ children, search }: AppHtmlProps) => JSX.Element> {
  let twitterImageURL = yield* useAbsoluteUrl(
    "/assets/images/meta-effection.png",
  );
  let homeURL = yield* useAbsoluteUrl("/");
  let library = yield* LibraryRepositoryContext.expect();
  let contrib = yield* ContribRepositoryContext.expect();
  let contribMain = yield* contrib.loadRef();
  let workspaces = yield* contribMain.loadWorkspaces();

  const navLinks: JSXElement[] = [
    <a href="/docs/installation">Guides</a>,
    <a href="/api">API</a>,
    <a class="flex flex-row" href="/contrib">
      <span class="hidden md:inline-flex">Contrib ({workspaces.length})</span>
    </a>,

    <a class="flex flex-row" href="https://github.com/thefrontside/effection">
      <span class="hidden md:inline-flex flex-row space-x-1">
        <span>GitHub</span>
        <span class="flex flex-row items-center">
          <StarIcon class="text-white pr-0.5" />
          <span>{yield* library.starCount()}</span>
          <span class="font-black">+</span>
        </span>
      </span>
    </a>,
    <a class="flex flex-row" href="https://discord.gg/r6AvtnU">
      <span class="pr-1 md:inline-flex">
        <IconDiscord />
      </span>
      <span class="hidden md:inline-flex">Discord</span>
    </a>,
    <ProjectSelect classnames="sm:hidden shrink-0" />,
    <>
      <p class="flex flex-row invisible">
        <label class="cursor-pointer" for="nav-toggle">
          <Navburger />
        </label>
      </p>
      <style media="all">
        {`
  #nav-toggle:checked ~ aside#docbar {
  display: none;
  }
  `}
      </style>
    </>,
  ];

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
        <Header navLinks={navLinks} />
        <main data-pagefind-body={search} class="container max-w-screen-2xl mx-auto mb-auto p-5">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
