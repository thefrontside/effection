import type { JSXChild, JSXHandler } from "revolution";

import { useAppHtml } from "./app.html.tsx";
import { Footer } from "../components/footer.tsx";

export function indexRoute(): JSXHandler {
  return function* () {
    let AppHtml = yield* useAppHtml({ title: `Effection` });

    return (
      <AppHtml>
        <>
          <article class="p-4 md:px-12 mb-16">
            <section class="grid grid-cols-1 md:grid-cols-3 md:gap-4">
              <hgroup class="text-center col-span-1 md:col-span-3">
                <img
                  class="inline min-w-[20%]"
                  alt="Effection Logo"
                  src="/assets/images/icon-effection.svg"
                  width={288}
                  height={288}
                />
                <h1 class="text-4xl font-bold leading-7">Effection</h1>
                <p class="text-sm py-4">
                  Structured Concurrency and Effects for JavaScript
                </p>
                <a
                  class="inline-block mt-2 p-3 text-white w-full rounded bg-blue-900 md:w-48"
                  href="/docs/introduction"
                >
                  Get Started
                </a>
              </hgroup>
              <Feature summary="👩🏻‍💻 100% JavaScript">
                No build steps. No esoteric APIs, and no new odd-ball paradigms
                to learn; Effection leans into JavaScript's natural constructs
                at every turn, so code always feels intuitive.
              </Feature>

              <Feature summary="🛡️ Leak proof">
                Effection code cleans up after itself, and that means never
                having to remember to manually close a resource or detach a
                listener.
              </Feature>
              <Feature summary="🖐️ Halt any operation">
                An Effection operation can be shut down at any moment which will
                not only stop it completely but also stop any other operations
                that it started.
              </Feature>
              <Feature summary="🔒 Synchronicity">
                Unlike Promises and async/await, Effection is fundamentally
                synchronous in nature, which means you have full control over
                the event loop and operations requiring synchronous setup remain
                race condition free.
              </Feature>
              <Feature summary="🎹 Seamless composition">
                Since all Effection code is well behaved, it clicks together
                easily, and there are no nasty surprises when fitting different
                pieces together.
              </Feature>
            </section>
            <section>
              <h2>Why use Effection?</h2>
              <p>
                JavaScript has gone through multiple evolutionary steps in how
                to deal with concurrency: from callbacks and events, to
                promises, and then finally to `async/await`. Yet it can still be
                difficult to write concurrent code which is both correct and
                composable, and unless you're very careful, it is still easy to
                leak resources. Most JavaScript code and libraries do not handle
                cancellation well, and so failure conditions can easily lead to
                dangling promises and other unexpected behavior.
              </p>

              <p>
                Effection brings [structured concurrency][structured
                concurrency] to JavaScript so that you can guarantee that you
                don't leak any resources, and that cancellation is properly
                handled. It helps you build concurrent code that feels rock
                solid and behaves well under all failure conditions. It does
                this all while feeling like very normal JavaScript.
              </p>
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
  children,
}: {
  summary: string;
  children: JSXChild;
}) {
  return (
    <hgroup class="mt-6">
      <h2>{summary}</h2>
      <p class="mt-3 text-sm">{children}</p>
    </hgroup>
  );
}
