import {
  command,
  description,
  type ModelOf,
  name,
  option,
  schema,
  toggle,
} from "@frontside/configliere";
import { type } from "arktype";

/**
 * A string parameter that falls back to `value` when nothing supplies it.
 *
 * Only total absence reaches the schema as `undefined`, which is why the
 * fallback lives in a morph rather than in arktype's `.default()` — the latter
 * is a property-level construct that does not produce a standalone schema.
 */
function fallback(value: string) {
  return type("string | undefined").pipe((supplied) => supplied ?? value);
}

const port = type("0 <= number <= 65535")
  .or("undefined")
  .pipe((supplied) => supplied ?? 8000);

/**
 * Every argument and environment variable that `main.tsx` accepts.
 *
 * Each parameter is addressable from the command line as `--kebab-case` and
 * from the environment as `SCREAMING_SNAKE_CASE`, both derived from its name.
 * The three variables that predate this schema — `GITHUB_TOKEN`, `JSR_API` and
 * `DENO_DEPLOYMENT_ID` — are named so that derivation reproduces the keys that
 * CI secrets and the Deno Deploy runtime already supply.
 *
 * Defaults reproduce the values that used to be hardcoded, so running
 * `deno run -A main.tsx` with no arguments behaves as it did before.
 */
export const www = command(
  name("www"),
  description(
    "Serve the Effection website, assembling docs and packages from GitHub.",
  ),
  option(
    name("port"),
    description("Port the HTTP server listens on. 0 picks a free port."),
    schema(port),
  ),
  option(
    name("githubToken"),
    description(
      "GitHub access token for the API. Requests are unauthenticated when empty.",
    ),
    schema(fallback("")),
  ),
  option(
    name("jsrApi"),
    description("JSR API token. The package score card is skipped when empty."),
    schema(fallback("")),
  ),
  option(
    name("denoDeploymentId"),
    description(
      "Deployment identity behind the ETag. A fresh id per boot when empty.",
    ),
    schema(fallback("")),
  ),
  option(
    name("effectionxDir"),
    description(
      "Local checkout of thefrontside/effectionx to read instead of cloning it.",
    ),
    schema(fallback("")),
  ),
  option(
    name("clonesDir"),
    description("Directory holding git clones of the documented repositories."),
    schema(fallback("build/clones")),
  ),
  option(
    name("worktreesDir"),
    description("Directory holding a git worktree for each documented series."),
    schema(fallback("build/worktrees")),
  ),
  option(
    name("pagefindDir"),
    description("Directory holding the generated Pagefind search bundle."),
    schema(fallback("pagefind")),
  ),
  option(
    name("tailwindInput"),
    description("Tailwind entry stylesheet."),
    schema(fallback("main.css")),
  ),
  option(
    name("tailwindOutdir"),
    description("Directory the compiled stylesheet is written to."),
    schema(fallback("tailwind")),
  ),
  toggle(
    name("verbose"),
    description("Emit debug and warning logs in addition to info and error."),
  ),
);

/** The validated configuration available once `www` is executed. */
export type Options = ModelOf<typeof www>;
