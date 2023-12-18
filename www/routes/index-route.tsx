import type { JSXChild, JSXHandler } from "revolution";

import { useAppHtml } from "./app.html.tsx";
import { Footer } from "../components/footer.tsx";
import { IconTSLogo } from "../components/icons/typescript.tsx";
import { IconCartouche } from "../components/icons/cartouche.tsx";
import { useAbsoluteUrl } from "../plugins/rebase.ts";

export function indexRoute(): JSXHandler {
  return function* () {
    let AppHtml = yield* useAppHtml({ title: `Effection` });
    let announcementUrl = yield* useAbsoluteUrl(
      "/blog/2023-12-18-announcing-effection-v3/"
    );

    return (
      <AppHtml>
        <>
          <article class="p-4 md:px-12 mb-16">
            <section class="grid grid-cols-1 md:grid-cols-3 md:gap-4">
              <hgroup class="text-center col-span-1 md:col-span-3 my-8">
                <img
                  class="inline max-w-[30%] mb-4"
                  alt="Effection Logo"
                  src="/assets/images/icon-effection.svg"
                  width={144}
                  height={144}
                />
                <h1 class="text-4xl font-bold leading-7">Effection</h1>
                <p class="text-2xl py-4 mb-6">
                  Structured Concurrency and Effects for JavaScript
                </p>
                <div class="grid grid-cols-6 gap-y-2 gap-x-2">
                  <a
                    class="col-span-6 md:col-span-2 md:col-start-2 lg:col-span-1 lg:col-start-3 p-2 mr-2 text-md text-white w-full border-blue-900 border-solid border-2 rounded bg-blue-900 hover:bg-blue-800 transition-colors md:px-4"
                    href="/docs/installation"
                  >
                    Get Started
                  </a>
                  <a
                    class="col-span-6 md:col-span-2 p-2 lg:col-span-1 text-md text-blue-900 bg-white hover:bg-blue-100 transition border-blue-900 border-solid border-2 w-full rounded md:px-4"
                    href="https://deno.land/x/effection/mod.ts"
                  >
                    API Reference
                  </a>
                  <p class="col-span-6 text-center">
                    <span class="inline-block bg-sky-100 text-blue-900 rounded py-2 px-4 w-fit border border-sky-200">
                      December 18, 2023 - We're proud to{" "}
                      <a
                        class="underline underline-offset-4"
                        href={announcementUrl}
                      >
                        announce the release of Effection 3.0.
                      </a>
                    </span>
                  </p>
                </div>
              </hgroup>
            </section>

            <section class="my-20">
              <hgroup class="mx-auto max-w-2xl lg:text-center">
                <h2 class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Latest video
                </h2>
                <p class="mt-6 text-lg leading-8 text-gray-600 mb-2">
                  Watch Charles Lowell, the creator of Effection, explain
                  Effection and answer frequenty asked questions.
                </p>
                <iframe
                  class="mx-auto max-w-2xl"
                  width={560}
                  height={315}
                  src="https://www.youtube.com/embed/lJDgpxRw5WA?si=rZuOYa_UWDdP1G_V"
                  title="YouTube video player"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              </hgroup>
            </section>

            <section class="my-20 mx-auto max-w-7xl px-6 lg:px-8">
              <hgroup class="mx-auto max-w-2xl lg:text-center">
                <h2 class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Stop worrying about asynchrony
                </h2>
                <p class="mt-6 text-lg leading-8 text-gray-600">
                  Effection gives you control over asyncronous operations with{" "}
                  <a
                    class="underline underline-offset-4"
                    href="/docs/thinking-in-effection"
                  >
                    Structured Concurrency guarantees
                  </a>
                  . We ensure that all asyncronous operations are well behaved
                  so you can focus on using async instead of managing it.
                </p>
              </hgroup>
              <div class="mx-auto mt-8 max-w-2xl sm:mt-12 lg:mt-16 lg:max-w-4xl md:grid md:grid-cols-2 md:gap-y-4">
                <Feature icon={"🛡️"} summary={"Leak proof"}>
                  Effection code cleans up after itself, and that means never
                  having to remember to manually close a resource or detach a
                  listener.
                </Feature>

                <Feature icon={"🖐️"} summary="Halt any operation">
                  An Effection operation can be shut down at any moment which
                  will not only stop it completely but also stop any other
                  operations that it started.
                </Feature>

                <Feature icon={"🔒"} summary="Race condition free">
                  Unlike Promises and async/await, Effection is fundamentally
                  synchronous in nature, which means you have full control over
                  the event loop and operations requiring synchronous setup
                  remain race condition free.
                </Feature>

                <Feature icon={"🎹"} summary="Seamless composition">
                  Since all Effection code is well behaved, it clicks together
                  easily, and there are no nasty surprises when fitting
                  different pieces together.
                </Feature>
              </div>
            </section>

            <section class="my-20">
              <hgroup class="mx-auto max-w-2xl lg:text-center">
                <h2 class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  It's just JavaScript
                </h2>
                <p class="mt-6 text-lg leading-8 text-gray-600">
                  Effection is a light-weight alternative to{" "}
                  <code>async/await</code> with Structured Concurrency
                  guarantees. It only requires adding a few new JavaScript
                  techniques to the knowledge you already have.
                </p>
              </hgroup>
              {/* No build steps. No esoteric APIs, and no new odd-ball
              paradigms to learn; Effection leans into JavaScript's natural
              constructs at every turn, so code always feels intuitive. */}
              <div class="mx-auto mt-8 max-w-2xl sm:mt-12 lg:mt-16 lg:max-w-4xl md:grid md:grid-cols-2 md:gap-y-4">
                <Feature icon={"😎"} summary="Use familiar language constructs">
                  <>
                    Use <code>let</code>, <code>const</code>, <code>for</code>,{" "}
                    <code>while</code>, <code>switch/case</code> and{" "}
                    <code>try/catch/finally</code> to write asyncrous
                    operations. They work as you'd expect.
                  </>
                </Feature>
                <Feature
                  icon={<IconTSLogo />}
                  summary="First-class TypeScript Support"
                >
                  <>
                    Use in TypeScript or JavaScript projects without modifying
                    your build setup. Effection operations can be used and
                    distributed in pure ESM code.
                  </>
                </Feature>
                <Feature icon={"😵‍💫"} summary="No esoteric APIs">
                  <>
                    Small API focused excusively on what you need to gain
                    Structured Concurrency guarantees in JavaScript and nothing
                    else.
                  </>
                </Feature>
                <Feature
                  icon={<IconCartouche />}
                  summary="Async/Await/Promise alternatives"
                  iconSize="h-14 w-14"
                >
                  <>
                    For every Async/Await/Promise API we provide Structured
                    Concurrency compliant Effection alternative. Checkout our{" "}
                    <a
                      class="underline underline-offset-4"
                      href="/docs/async-rosetta-stone"
                    >
                      Async Rosetta Stone
                    </a>{" "}
                    for translations.
                  </>
                </Feature>
                <Feature icon={"💪"} summary="Small but powerful">
                  <>
                    Everything you need comes in one dependency-free package. At
                    less than 5KB minified and gzipped, Effection can be dropped
                    into any project.
                  </>
                </Feature>
                <Feature icon={"💎"} summary="No build step">
                  <>
                    Use in TypeScript or JavaScript projects without modifying
                    your build setup. Effection operations can be used and
                    distributed in pure ESM code.
                  </>
                </Feature>
              </div>
            </section>
            <Footer />
          </article>
        </>
      </AppHtml>
    );
  };
}

function Feature({
  summary,
  icon,
  children,
  iconSize = "h-10 w-10 text-4xl",
}: {
  summary: string;
  icon: JSXChild;
  children: JSXChild;
  iconSize?: string;
}) {
  return (
    <div class="relative pl-16 mb-8">
      <dt class="text-base font-semibold leading-7 text-gray-900">
        <div
          class={`absolute left-0 top-0 flex items-center justify-center rounded-lg ${iconSize}`}
        >
          {icon}
        </div>
        {summary}
      </dt>
      <dd class="mt-2 text-base leading-7 text-gray-600">{children}</dd>
    </div>
  );
}
