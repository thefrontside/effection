import type { JSXChild, JSXElement } from "revolution";

import { useAppHtml } from "./app.html.tsx";
import { SitemapRoute } from "../plugins/sitemap.ts";
import { CodeWindow } from "../components/code-window.tsx";
import { OperationTree } from "../components/operation-tree.tsx";
import { UseCaseTabs } from "../components/usecase-tabs.tsx";
import { InstallCopy } from "../components/install-copy.tsx";
import { IconGithub } from "../components/icons/github.tsx";
import { IconExternal } from "../components/icons/external.tsx";

const REPO = "https://github.com/thefrontside/effection";
const STRICT_SC =
  "https://frontside.com/effection/blog/2026-04-07-strict-structured-concurrency/";

export function indexRoute(): SitemapRoute<JSXElement> {
  return {
    *routemap(generate) {
      return [{ pathname: generate() }];
    },
    handler: function* () {
      let AppHtml = yield* useAppHtml({
        title: `Effection`,
        description:
          "Structured concurrency for JavaScript. Leak-proof cleanup, real cancellation and scoped context — in one dependency-free package.",
        head: <script type="module" src="/assets/home-islands.js"></script>,
      });

      return (
        <AppHtml search>
          <article class="text-gray-800 dark:text-gray-200">
            {/* ============ 1 · THE DEAL (hero) ============ */}
            <section class="mx-auto max-w-4xl px-4 pt-16 md:px-12">
              <div class="mx-auto max-w-2xl text-center">
                <h1 class="text-[2.5rem] font-extrabold leading-[1.15] tracking-tight text-[#14315D] [text-wrap:balance] dark:text-gray-100">
                  JavaScript cleans up your memory. It never cleans up your
                  async.
                </h1>
                <p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  Every value belongs to a scope; when the scope is gone, the
                  runtime reclaims it. Async work belongs to nothing — it runs
                  until it's done, whether or not the code that started it is
                  still around.
                </p>
                <p class="mx-auto mt-4 max-w-xl text-lg font-semibold leading-relaxed text-[#14315D] dark:text-gray-100">
                  Effection makes async work the way memory already does.
                </p>
              </div>
            </section>

            {/* ============ 2 · THE EXCEPTION ============ */}
            <section class="mt-20 rounded-2xl bg-gray-100 px-6 py-16 dark:bg-gray-800/40 md:px-12">
              <SectionHead
                eyebrow="The exception"
                title="Memory is reclaimed according to the structure of your code. Asynchronous operations aren't."
                lead={
                  <>
                    A promise doesn't belong to the scope that created it. When
                    the scope exits, the promise keeps running — and because it
                    belongs to nothing, the runtime has no way of knowing when
                    its lifetime is over.
                  </>
                }
              />
              <p class="mx-auto mt-9 max-w-2xl text-center text-lg leading-relaxed text-gray-700 dark:text-gray-200">
                So that knowledge has to come from you. The{" "}
                <code>AbortSignal</code>{" "}
                you thread through every call, the unsubscribe you remember, the
                {" "}
                <code>close()</code> in a <code>finally</code>, the{" "}
                <code>using</code>{" "}
                you declare one resource at a time — different tools, all
                reconstructing the same missing information:{" "}
                <em>when this work should end</em>. We spent a decade
                reconstructing this missing lifetime by hand.
              </p>
            </section>

            {/* the claim — the name for what the reader already understands */}
            <section class="mx-auto max-w-3xl px-6 pt-16 text-center">
              <p class="text-2xl font-extrabold leading-snug tracking-tight md:text-3xl">
                <span class="text-gray-400 dark:text-gray-500">
                  JavaScript has async/await.
                </span>
                <br />
                <span class="text-[#14315D] dark:text-gray-100">
                  It doesn't have{" "}
                </span>
                <span class="bg-[linear-gradient(90deg,#14315d,#3b357f_55%,#26abe8)] bg-clip-text text-transparent dark:bg-[linear-gradient(90deg,#26abe8,#a855f7_55%,#f74d7b)]">
                  structured concurrency
                </span>
                <span class="text-[#14315D] dark:text-gray-100">.</span>
              </p>
            </section>

            <p class="mx-auto mt-9 max-w-2xl px-6 text-center text-lg leading-relaxed text-gray-700 dark:text-gray-200">
              But none of it would be necessary if the work simply belonged to
              the scope that started it — the runtime would know when it ends,
              the same way it knows when a value dies. That's not a workaround.
              It's a property a language either has or doesn't.
            </p>

            {/* ============ EFFECTION ============ */}
            <section class="mx-auto max-w-4xl px-6 pt-20 text-center">
              <img
                src="/assets/images/icon-effection.svg"
                alt="Effection"
                width={72}
                height={72}
                class="mx-auto mb-4"
              />
              <h2 class="text-3xl font-extrabold tracking-tight text-[#14315D] dark:text-gray-100">
                Effection brings it to JavaScript
              </h2>
              <p class="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                Structured concurrency, built on generator functions — the same
                shapes you already write, with a caller that can always reclaim
                control. Under 6KB, dependency-free, no build step; it runs in
                Node, Deno, Bun and the browser, and it's been in production for
                five years.
              </p>

              <div class="mx-auto mt-10 grid max-w-2xl grid-cols-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 md:grid-cols-4">
                {[
                  ["800+", "GitHub stars"],
                  ["5 yrs", "maintained & evolving"],
                  ["100+", "dependent projects"],
                  ["15K", "weekly downloads"],
                ].map(([big, small], i) => (
                  <div
                    class={`px-3 py-5 text-center ${
                      i ? "border-l border-gray-200 dark:border-gray-700" : ""
                    }`}
                  >
                    <div class="font-mono text-2xl font-bold tracking-tight text-[#14315D] dark:text-gray-100">
                      {big}
                    </div>
                    <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {small}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ============ THE EVIDENCE ============ */}
            <section class="mx-auto mt-24 max-w-4xl px-6">
              <SectionHead
                eyebrow="See for yourself"
                title="The obvious code, tested"
                lead="If async work really is reclaimed when its operation exits, the defensive code should disappear. Look for the abort, the unsubscribe, the cancellation flag — they aren't there. And where teardown is genuinely needed, you declare it once and it's guaranteed to run."
              />
              <div class="mt-10">
                <UseCaseTabs />
              </div>
              <p class="mx-auto mt-16 max-w-xl text-center text-2xl font-extrabold leading-snug tracking-tight">
                <span class="text-gray-400 dark:text-gray-500">
                  It feels too simple to be correct.
                </span>
                <br />
                <span class="text-[#14315D] dark:text-gray-100">
                  It's correct because it's simple.
                </span>
              </p>
            </section>

            {/* operation tree — the proof */}
            <section class="mx-auto mt-20 max-w-2xl px-6">
              <p class="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                The operation tree
              </p>
              <h3 class="mb-7 text-center text-2xl font-extrabold tracking-tight text-[#14315D] dark:text-gray-100">
                Every operation belongs to the one that started it
              </h3>
              <OperationTree />
            </section>

            {/* structural features */}
            <section class="mx-auto mt-24 max-w-4xl px-6">
              <SectionHead
                eyebrow="The same tree, twice"
                title="Structured lifetimes unlock more than cleanup"
                lead="The tree above works in both directions. Teardown flows up it — and values can flow down it."
              />
            </section>
            <div class="mx-auto mt-12 flex max-w-4xl flex-col gap-20 px-6">
              <Power
                n="1"
                kicker="Halt"
                title="Cancel anything — and teardown is guaranteed"
                lead={
                  <>
                    Halt an operation and everything it spawned shuts down with
                    it — <code>try/finally</code> for synchronous cleanup,{" "}
                    <code>ensure</code>{" "}
                    for teardown that's itself async, both guaranteed to run.
                    It's the one thing <code>async/await</code>{" "}
                    structurally cannot do, and it's how Effection reclaims
                    background work on its own:{" "}
                    <Link href={STRICT_SC}>strict structured concurrency</Link>.
                  </>
                }
                code={`const task = yield* spawn(function* () {
  yield* ensure(() => closeConnection());  // async teardown
  yield* suspend();
});

yield* task.halt();   // stops the child and all it spawned`}
                filename="halt.ts"
              />
              <Power
                n="2"
                kicker="Context"
                flip
                title="Share state down the call tree, no prop-drilling"
                lead="Set a value once; read it anywhere below. It's scoped to the operation, so it disappears when the operation exits — dependency injection for async, without prop-drilling. TC39's AsyncContext is chasing the same idea; Effection has it today, tied to structured lifetimes."
                code={`const Token = createContext("token");

yield* Token.set("abc-123");
yield* fetchUser();            // never passes the token

function* fetchUser() {
  const token = yield* Token.expect();   // reads from context
}`}
                filename="context.ts"
              />
              <Power
                n="3"
                kicker="Synchronous by default"
                title="Stay synchronous until you actually need async"
                lead="A single yield* can resolve synchronously or asynchronously — where await always defers to the next tick. The same call reads a warm cache on the current tick, and crosses into async only on a real miss."
                code={`function* getUser(id) {
  // yield* resolves on THIS tick when warm, and
  // upgrades to an async fetch only on a miss.
  // (await would cost a tick even on a hit.)
  return yield* cache.read(id, function* () {
    return yield* fetchUser(id);
  });
}`}
                filename="cache.ts"
              />
            </div>

            {/* capstone — the GC analogy */}
            <section class="mt-24 rounded-2xl bg-gray-100 px-6 py-16 dark:bg-gray-800/40 md:px-12">
              <SectionHead
                eyebrow="What it all adds up to"
                title="Complex async, as simple as complex sync"
                lead="This isn't only about cancellation. Once every operation has a lifetime, the way you compose them changes too — you nest ordinary loops and functions as deep as you like, and none of it needs lifecycle bookkeeping."
              />
              <div class="mx-auto mt-10 max-w-xl">
                <CodeWindow
                  filename="server.ts"
                  code={`function* handleConnection(socket) {
  // each handles messages concurrently — no spawn needed
  for (const message of yield* each(socket)) {
    const updates = yield* subscribe(message.channel);
    yield* spawn(() => forward(client, updates));
    yield* process(message);
    yield* each.next();
  }
}`}
                />
                <p class="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Look for the code that shuts down those listeners and
                  background processes when the socket closes. It isn't there.
                </p>
              </div>
            </section>

            {/* ============ ADOPTION COST ============ */}
            <section class="mx-auto mt-24 max-w-4xl px-6">
              <SectionHead
                eyebrow="A small leap from async/await"
                title="If you know async/await, you already know most of it"
                lead="For the serial code that is most of what you write, adopting Effection is a near-mechanical translation. Same functions, loops and try/finally — you mostly swap await for yield*."
              />
              <div class="mx-auto mt-10 max-w-xl overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="grid grid-cols-2">
                  <div class="bg-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    async / await
                  </div>
                  <div class="border-l border-gray-200 bg-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#26ABE8] dark:border-gray-700 dark:bg-gray-800">
                    Effection
                  </div>
                </div>
                <>
                  {[
                    ["async function () {}", "function* () {}"],
                    ["await task", "yield* task"],
                    ["Promise.all([ … ])", "all([ … ])"],
                    ["Promise.race([ … ])", "race([ … ])"],
                    [
                      "try / finally  (sync cleanup)",
                      "try / finally — unchanged",
                    ],
                  ].map(([a, b]) => (
                    <div class="grid grid-cols-2 border-t border-gray-200 dark:border-gray-700">
                      <div class="px-4 py-3 font-mono text-[13.5px] text-gray-600 dark:text-gray-300">
                        {a}
                      </div>
                      <div class="border-l border-gray-200 px-4 py-3 font-mono text-[13.5px] text-[#14315D] dark:border-gray-700 dark:text-gray-100">
                        {b}
                      </div>
                    </div>
                  ))}
                </>
              </div>
              <p class="mt-6 text-center">
                <Link
                  href="/docs/async-rosetta-stone"
                  class="text-sm font-semibold"
                >
                  Resources, streams &amp; the rest — see the full Async Rosetta
                  Stone <IconExternal />
                </Link>
              </p>
            </section>

            {/* ============ CLOSING CTA ============ */}
            <section class="mt-24 rounded-2xl px-6 py-20 text-center text-white [background-image:linear-gradient(45deg,#14315d_-5%,#44378a,#26abe8_105%)]">
              <h2 class="text-3xl font-extrabold tracking-tight md:text-4xl">
                Get structured concurrency in JavaScript today.
              </h2>
              <p class="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-white/85">
                Leak-proof cleanup, real cancellation and scoped context — in
                one dependency-free package.
              </p>
              <div class="mt-7 flex justify-center">
                <InstallCopy />
              </div>
              <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/docs/installation"
                  class="rounded bg-white px-6 py-3 text-base font-bold text-[#14315D] transition-colors hover:bg-blue-50"
                >
                  Get Started
                </a>
                <a
                  href={REPO}
                  class="inline-flex items-center gap-2 rounded border border-white/40 bg-white/10 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-white/20"
                >
                  <IconGithub /> Star on GitHub
                </a>
              </div>
            </section>
          </article>
        </AppHtml>
      );
    },
  };
}

function Link(
  { href, class: cls = "", children }: {
    href: string;
    class?: string;
    children: JSXChild | JSXChild[];
  },
): JSXElement {
  return (
    <a
      href={href}
      class={`font-semibold text-blue-700 no-underline hover:underline dark:text-blue-400 ${cls}`}
    >
      {children}
    </a>
  );
}

function SectionHead(
  { eyebrow, title, lead }: {
    eyebrow?: string;
    title: string;
    lead?: JSXChild;
  },
): JSXElement {
  return (
    <hgroup class="mx-auto max-w-2xl text-center">
      {eyebrow
        ? (
          <p class="text-xs font-bold uppercase tracking-wider text-[#F74D7B]">
            {eyebrow}
          </p>
        )
        : <></>}
      <h2 class="mt-2.5 text-3xl font-extrabold leading-tight tracking-tight text-[#14315D] dark:text-gray-100">
        {title}
      </h2>
      {lead
        ? (
          <p class="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            {lead}
          </p>
        )
        : <></>}
    </hgroup>
  );
}

function Power(
  { n, kicker, title, lead, code, filename, flip = false }: {
    n: string;
    kicker: string;
    title: string;
    lead: JSXChild;
    code: string;
    filename: string;
    flip?: boolean;
  },
): JSXElement {
  let text = (
    <div>
      <div class="mb-4 flex items-center gap-3">
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-[13px] font-bold text-white [background-image:linear-gradient(45deg,#f74d7b,#a855f7,#26abe8)]">
          {n}
        </span>
        <span class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {kicker}
        </span>
      </div>
      <h3 class="mb-3.5 text-2xl font-extrabold leading-tight tracking-tight text-[#14315D] dark:text-gray-100">
        {title}
      </h3>
      <p class="text-base leading-relaxed text-gray-700 dark:text-gray-300">
        {lead}
      </p>
    </div>
  );
  let codeCol = (
    <div class="min-w-0">
      <CodeWindow filename={filename} code={code} />
    </div>
  );
  return (
    <div class="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
      {flip
        ? (
          <>
            <div class="order-2 md:order-1">{codeCol}</div>
            <div class="order-1 md:order-2">{text}</div>
          </>
        )
        : (
          <>
            {text}
            {codeCol}
          </>
        )}
    </div>
  );
}
