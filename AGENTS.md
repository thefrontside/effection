# Agents

This repository uses AI agents to assist with development tasks. This file provides entry points for agent discovery.

## Project Overview

effectionx is a TypeScript monorepo containing community packages built on
[Effection](https://frontside.com/effection) structured concurrency library.
Packages are published to NPM under the `@effectionx` scope.

## Effection

This repository builds on [Effection](https://github.com/thefrontside/effection), a structured concurrency library. Before working with code here, read the [Effection AGENTS.md](https://github.com/thefrontside/effection/blob/v4/AGENTS.md) for essential concepts:

- Operations vs Promises (lazy vs eager execution)
- Scope ownership and structured concurrency
- Entry points (`main()`, `run()`, `createScope()`)
- Streams, channels, and the `each()` pattern

## Available Agents

| Agent | Purpose | Location |
|-------|---------|----------|
| [Policy Officer](.agents/policy-officer.md) | Enforces code and documentation policies | `.agents/policy-officer.md` |

## Policies

Static analysis policies are documented in [`.policies/index.md`](.policies/index.md). The Policy Officer agent uses these to verify compliance.

## For AI Agents

When working in this repository:

1. **Read this file first** to understand available agents and policies
2. **Check applicable policies** before making changes (see `.policies/index.md`)
3. **Follow progressive disclosure** - start with index files, then drill into specifics as needed

---

## Tech Stack

- **Runtime**: Node.js 22.12.0 (via Volta)
- **Package Manager**: pnpm 9.15.9
- **Build**: TypeScript 5+, Turbo
- **Linting/Formatting**: Biome
- **Testing**: Node.js test runner

## Code Review Policies

**IMPORTANT**: All code reviews must follow the policies in `.policies/index.md`.
Read `.agents/policy-officer.md` for the expected review format and process.

When reviewing PRs:
1. Read `.policies/index.md` to get the list of active policies
2. Read each linked policy document
3. Apply policy checks to changed files
4. Use the output format from `.agents/policy-officer.md`

## Coding Standards

### TypeScript

- Strict mode enabled
- Use `NodeNext` module resolution
- Target ES2022
- Prefer `type` imports for type-only imports
- Use explicit return types on public functions

### Effection Patterns

- Use structured concurrency (spawn, scope)
- Resources must clean up properly on scope exit
- **Teardown that needs `yield*` must go in `ensure()`, never in a `finally` block.**
  When a task is halted Effection unwinds it with `iterator.return()`; if a `finally`
  yields, the resume comes back as `iterator.next()`, which takes the frame out of
  return-mode and the halt is lost. Synchronous cleanup in `finally` is fine.
  See the [Async Teardown policy](.policies/async-teardown.md)
- Prefer `Operation<T>` for async operations
- Use `*[Symbol.iterator]` pattern for reusable stream operations (see Stateless Streams policy)
- Avoid `sleep()` for test synchronization (see No-Sleep Test Sync policy)

## Commit and PR conventions

Use [gitmoji](https://gitmoji.dev) for commit and pull request subjects. For
changes to files that direct the behavior of AI such as AGENTS.md or llms.txt
use a robot emoji instead of the standard gitmoji for documentation

Do not include any agent marketing material (e.g. "Generated with...",
"Co-Authored-By: \<agent>") in commits, pull requests, issues, or comments.

## Package Structure

Each package requires:

```
<package>/
├── mod.ts            # Main entry point (exports public API)
├── package.json      # Package manifest with peerDependencies
├── tsconfig.json     # Extends root tsconfig
├── *.test.ts         # Tests using Node.js test runner
└── README.md         # Documentation (text before --- used as description)
```

### package.json Requirements

- `name`: `@effectionx/<package-name>`
- `description`: Required — single sentence, under 120 chars, no Markdown, no trailing period (see [Package.json Metadata policy](.policies/package-json-metadata.md))
- `type`: `"module"`
- `exports`: Must include `types`, `development`, `import`, and `default` conditions
- `peerDependencies`: Usually `effection: "^3 || ^4"`
- `files`: Include `dist`, `mod.ts`, and source files

### Test Files

- Use Node.js test runner (`node --test`)
- Import test utilities from `@effectionx/bdd` when needed
- Tests run with `--env-file=../.env`

## Commands

```bash
pnpm build          # Build all packages (TypeScript + bundling)
pnpm build:tsc      # Build TypeScript only
pnpm test           # Run all tests
pnpm test:matrix    # Test against peer dependency versions
pnpm check          # Type-check all packages
pnpm lint           # Lint all packages
pnpm fmt            # Format all files
pnpm fmt:check      # Check formatting
pnpm sync           # Check tsconfig references
pnpm sync:fix       # Fix tsconfig references and dependencies
```

## Repository Structure

```
effectionx/
├── .github/workflows/  # CI/CD workflows
├── .internal/          # Internal tooling (not published)
├── .policies/          # Code review policies
├── .agents/            # Agent instructions
├── <package>/          # Individual packages
└── package.json        # Root workspace config
```
