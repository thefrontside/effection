# AGENTS.md — Effection repository contract

This file is for AI agents contributing to the Effection repository. It adds
repository-only rules on top of the public behavioral contract, which it does
not repeat.

Before you modify or reason about Effection code, read the public contract in
[`docs/agents.md`](docs/agents.md), the copy checked out on this branch. It
holds the invariants: operations versus promises, scope ownership, tasks and
halting, context, the concurrency operations, promise interoperability,
resources and cleanup, `ensure()`, `useAbortSignal()`, and streams.

Instructions scoped to a subdirectory, such as [`www/AGENTS.md`](www/AGENTS.md)
for the website, apply in addition to this file.

## Code style

- Always use braces for `if` statements. No bare/braceless `if` blocks.

## Commit and PR conventions

Use [gitmoji](https://gitmoji.dev) for commit and pull request subjects. For
changes to files that direct the behavior of AI such as AGENTS.md or llms.txt
use a robot emoji instead of the standard gitmoji for documentation

Do not include any agent marketing material (e.g. "Generated with...",
"Co-Authored-By: \<agent>") in commits, pull requests, issues, or comments.

## Pre-commit workflow

Before committing any changes to this repository:

1. Run `deno fmt` to format all changed files
2. Run `deno lint` to check for lint errors (TypeScript files only)
3. Fix any issues before committing

This applies to all file types that Deno formats (TypeScript, JavaScript,
Markdown, JSON, etc.). The `www/` subdirectory follows the same rules.

## Pull requests

When creating a pull request, use the template at
`.github/pull_request_template.md`. The PR description must include:

- **Motivation** — describe the problem or feature request the PR addresses.
- **Approach** — provide a brief summary of the changes made.
