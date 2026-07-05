import type { JSXChild, JSXElement } from "revolution";

import { useAppHtml } from "./app.html.tsx";
import { SitemapRoute } from "../plugins/sitemap.ts";
import { CodeWindow } from "../components/code-window.tsx";
import { OperationTree } from "../components/operation-tree.tsx";
import { InstallCopy } from "../components/install-copy.tsx";
import { IconGithub } from "../components/icons/github.tsx";
import { IconExternal } from "../components/icons/external.tsx";

const REPO = "https://github.com/thefrontside/effection";
const EVENT_HORIZON =
  "https://frontside.com/blog/2023-12-11-await-event-horizon/";
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
            {/* ============ BEAT 1 · THE PROBLEM ============ */}
            <section class="mx-auto max-w-4xl px-4 pt-12 md:px-12">
              <div class="mx-auto max-w-2xl text-center">
                <p class="mb-6 inline-block rounded-full border border-pink-200 bg-pink-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#F74D7B] dark:border-[#F74D7B]/40 dark:bg-[#F74D7B]/10">
                  Every JS library author has shipped this bug
                </p>
                <h1 class="text-4xl font-extrabold leading-[1.08] tracking-tight text-[#14315D] dark:text-gray-100 md:text-5xl">
                  You wrote the cleanup. It still didn't run.
                </h1>
                <p class="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  Your helper acquires a lock, runs the caller's work, releases
                  it in a finally. The code is correct — until the caller is
                  cancelled half a second early. Then control never comes back,
                  the finally never runs, and the lock leaks.
                </p>
              </div>

              <div class="mx-auto mt-10 max-w-xl">
                <CodeWindow
                  filename="protect.ts"
                  code={`// A helper you ship. Looks bulletproof.
async function protect(work) {
  const lock = await acquireLock();
  try {
    await work();
  } finally {
    release(lock);   // …unless work() never returns
  }
}`}
                />
                <p class="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  The caller hits <code>CTRL-C</code>{" "}
                  at 9.5s of a 10s job. Control is trapped past the{" "}
                  <code>await</code>; the <code>finally</code>{" "}
                  never runs; the lock leaks. And it isn't just locks — every
                  {" "}
                  <strong>subscription</strong>, <strong>child process</strong>,
                  {" "}
                  <strong>socket</strong> and <strong>timer</strong>{" "}
                  your library starts can outlive the moment it mattered.
                </p>
              </div>
            </section>

            {/* ============ BEAT 2 · NOT YOUR CODE ============ */}
            <section class="mt-16 rounded-2xl bg-gray-100 px-6 py-16 dark:bg-gray-800/40 md:px-12">
              <SectionHead
                eyebrow="Why you can't just be more careful"
                title="It isn't your code. It's the await boundary."
                lead={
                  <>
                    Once execution crosses an{" "}
                    <code>await</code>, the caller can no longer regain control
                    until the promise settles. It's baked into the runtime, not
                    a lack of discipline — a property we dig into as the{" "}
                    <Link href={EVENT_HORIZON}>await event horizon</Link>.
                  </>
                }
              />

              <div class="mx-auto mt-10 max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div class="grid grid-cols-2">
                  <div class="bg-gray-100 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    What you expect
                  </div>
                  <div class="border-l border-gray-200 bg-gray-100 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#F74D7B] dark:border-gray-700 dark:bg-gray-800">
                    What JavaScript guarantees
                  </div>
                </div>
                <>
                  {[
                    [
                      "The caller can stop the work",
                      "The callee decides when it ends",
                    ],
                    [
                      "Work ends when it's no longer needed",
                      "Work ends when its innermost promise settles",
                    ],
                  ].map(([a, b]) => (
                    <div class="grid grid-cols-2 border-t border-gray-200 dark:border-gray-700">
                      <div class="px-5 py-4 text-base leading-snug text-gray-600 dark:text-gray-300">
                        {a}
                      </div>
                      <div class="border-l border-gray-200 px-5 py-4 text-base font-semibold leading-snug text-[#14315D] dark:border-gray-700 dark:text-gray-100">
                        {b}
                      </div>
                    </div>
                  ))}
                </>
              </div>

              <p class="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                You already know the workarounds — and why they fall short.{" "}
                <code>try/finally</code>{" "}
                waits on the wrong side of the boundary;{" "}
                <code>AbortSignal</code>{" "}
                is a request the callee can ignore. Neither hands control back
                to the caller.
              </p>

              <p class="mx-auto mt-9 max-w-xl text-center text-lg font-medium leading-relaxed text-gray-700 dark:text-gray-200">
                Flip it, and the problem dissolves: let the caller decide when
                its children end — and always be able to reclaim them. That
                property has a name.
              </p>
            </section>

            {/* bridge claim */}
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

            {/* ============ BEAT 3 · PROVEN, CHEAP ============ */}
            <section class="mx-auto max-w-4xl px-6 pt-14">
              <SectionHead
                eyebrow="A proven model"
                title="Every other major language already has it."
                lead="The idea is proven: Kotlin, Swift and Python already made structured concurrency first-class in the language. JavaScript hasn't — but you don't have to wait for it. You can have the same guarantees today, at the lowest total cost of any option."
              />
              <div class="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  ["Bundle", "< 7KB gzipped"],
                  ["Learning", "no new mental model"],
                  ["Build", "none — pure ESM"],
                  ["Runtime", "Node · Deno · Bun · browser"],
                ].map(([k, v]) => (
                  <div class="rounded-lg border border-gray-200 bg-white px-3 py-5 text-center dark:border-gray-700 dark:bg-gray-900">
                    <div class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {k}
                    </div>
                    <div class="mt-2 text-sm font-bold leading-snug text-[#14315D] dark:text-gray-100">
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Why wait for the platform to catch up when the price of adopting
                it now is this small?
              </p>
            </section>

            {/* ============ BEAT 4 · EFFECTION ============ */}
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
                shape as async/await, but a caller can always reclaim control.
                Here is <code>protect()</code> again, now leak-proof:
              </p>
              <div class="mx-auto mt-8 max-w-xl text-left">
                <CodeWindow
                  filename="protect.ts"
                  code={`function* protect(work) {
  const lock = yield* acquireLock();
  try {
    yield* work();
  } finally {
    release(lock);   // halt forces control back — always runs
  }
}`}
                />
              </div>

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

            {/* operation tree — the proof */}
            <section class="mx-auto mt-20 max-w-2xl px-6">
              <p class="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                The operation tree
              </p>
              <h3 class="mb-7 text-center text-2xl font-extrabold tracking-tight text-[#14315D] dark:text-gray-100">
                Halt forces control back — teardown always runs
              </h3>
              <OperationTree />
            </section>

            {/* three superpowers */}
            <section class="mx-auto mt-24 max-w-4xl px-6">
              <SectionHead
                eyebrow="Three superpowers you get for free"
                title="Structured lifetimes unlock more than cleanup"
                lead="Once every operation has a well-defined lifetime, a few things that were painful in plain async become trivial."
              />
            </section>
            <div class="mx-auto mt-12 flex max-w-4xl flex-col gap-20 px-6">
              <Power
                n="1"
                kicker="Halt"
                title="Cancel anything — and teardown is guaranteed"
                lead="Any operation can be halted, and halting a parent shuts down everything it spawned. Synchronous cleanup in try/finally just works; for teardown that must itself do async work, ensure guarantees it runs."
                bullets={[
                  <>
                    The thing <code>async/await</code> structurally cannot do.
                  </>,
                  <>This is what makes Effection leak-proof by construction.</>,
                  <>
                    Background tasks are reclaimed automatically when the
                    foreground result is done —{" "}
                    <Link href={STRICT_SC}>strict structured concurrency</Link>.
                  </>,
                ]}
                code={`const task = yield* spawn(function* () {
  yield* ensure(() => closeConnection());  // async teardown
  yield* suspend();
});

yield* task.halt();   // stops the child and all it spawned`}
                filename="halt.ts"
              />
              <Power
                n="2"
                kicker="Synchronous by default"
                flip
                title="Stay synchronous until you actually need async"
                lead="A single yield* can resolve synchronously or asynchronously — where await always defers to the next tick. So the exact same call reads a warm cache on the current tick, and only crosses into async on a real miss."
                bullets={[
                  <>
                    One uniform <code>yield*</code>{" "}
                    — sync on a hit, async on a miss.
                  </>,
                  <>
                    No wasted microtask on the hot path, and no race between
                    concurrent callers.
                  </>,
                ]}
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
              <Power
                n="3"
                kicker="Context"
                title="Share state down the call tree, no prop-drilling"
                lead="Set a value once; read it anywhere below. It's scoped to the operation, so it disappears when the operation exits. TC39's AsyncContext is chasing the same idea — Effection has it today, tied to structured lifetimes."
                bullets={[
                  <>
                    The primitive you didn't know you wanted — and can use now.
                  </>,
                  <>
                    Perfect for dependency injection, request scopes,
                    connections, loggers and tokens.
                  </>,
                ]}
                code={`const Token = createContext("token");

yield* Token.set("abc-123");
yield* fetchUser();            // never passes the token

function* fetchUser() {
  const token = yield* Token.expect();   // reads from context
}`}
                filename="context.ts"
              />
            </div>

            {/* capstone — the GC analogy */}
            <section class="mt-24 rounded-2xl bg-gray-100 px-6 py-16 dark:bg-gray-800/40 md:px-12">
              <SectionHead
                eyebrow="What it all adds up to"
                title="Complex async, as simple as complex sync"
                lead="This isn't only about cancellation. Once every operation has a lifetime, the way you compose them changes too — you nest ordinary loops and functions as deep as you like, and none of it needs lifecycle bookkeeping. It's the same deal garbage collection gives you for memory: write the logic, and the runtime reclaims what you've stopped using."
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

            {/* ============ BEAT 5 · ADOPTION COST ============ */}
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
  { n, kicker, title, lead, bullets = [], code, filename, flip = false }: {
    n: string;
    kicker: string;
    title: string;
    lead: string;
    bullets?: JSXChild[];
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
      {bullets.length
        ? (
          <ul class="mt-4 flex list-none flex-col gap-2 p-0">
            {bullets.map((b) => (
              <li class="flex gap-2.5 text-sm leading-normal text-gray-600 dark:text-gray-400">
                <span class="flex-none font-extrabold text-[#26ABE8]">
                  →
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )
        : <></>}
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
