# Policies Index

This is the **single source of truth** for all policies in this repository.

## Policy States

| State            | Compliance | Description                                               |
| ---------------- | ---------- | --------------------------------------------------------- |
| **Strict**       | Required   | Violations must be fixed before merge                     |
| **Recommended**  | Required   | Violations should be fixed; exceptions need justification |
| **Experimental** | Advisory   | Feedback only; no blocking violations                     |

## Policy Documents

### Established Policies

| Policy                                                   | State       | Description                                                            |
| -------------------------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| [No-Sleep Test Synchronization](./no-sleep-test-sync.md) | Recommended | Use deterministic helpers instead of sleep() for test synchronization  |
| [Server-Is-The-Build](./server-is-the-build.md)          | Recommended | Prefer on-demand server generation over build-time scripts             |
| [Stateless Stream Operations](./stateless-streams.md)    | Recommended | Use `*[Symbol.iterator]` pattern for reusable stream operations        |
| [Version Bump](./version-bump.md)                        | Recommended | PRs changing package code must include a semantic version bump         |
| [Async Teardown](./async-teardown.md)                    | Recommended | Teardown that needs `yield*` must use `ensure()`, not a `finally` block |
| [Package.json Metadata](./package-json-metadata.md)      | Strict      | Every published package must include a description field               |
| [No Agent Marketing](./no-agent-marketing.md)            | Strict      | No AI tool promotional material in commits, PRs, issues, or comments   |

### Experimental Policies (cowboyd Review Patterns)

These policies were extracted from cowboyd's historical code review comments across the thefrontside organization. They are currently **Experimental** (advisory only) and will be promoted based on feedback.

| Policy                                                                 | State        | Description                                                       |
| ---------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| [Type-Driven Design](./type-driven-design.md)                          | Experimental | Types should force correct usage; no escaping through `any`       |
| [Structured Concurrency](./structured-concurrency.md)                  | Experimental | Task lifetimes must be explicit; no fire-and-forget async work    |
| [Minimal and Interoperable APIs](./minimal-apis.md)                    | Experimental | Keep public API surface small; align with platform standards      |
| [Deterministic and Diagnostic Tests](./deterministic-tests.md)         | Experimental | Tests must be stable and produce clear failure output             |
| [Documentation Is Part of the API](./documentation.md)                 | Experimental | User-visible changes require docs; document lifecycle semantics   |
| [Backwards Compatibility](./backwards-compatibility.md)                | Experimental | Be explicit about breaking changes; deprecate intentionally       |
| [Naming and Consistency](./naming-consistency.md)                      | Experimental | Names should reveal intent; use Effection vocabulary consistently |
| [Correctness Through Explicit Invariants](./correctness-invariants.md) | Experimental | Encode assumptions; validate inputs; test edge cases              |
| [Small, Composable Units](./composable-units.md)                       | Experimental | Extract focused helpers; each piece has one reason to change      |
| [Start With Why](./start-with-why.md)                                  | Experimental | Ask for intent before prescribing changes (review rubric)         |
| [Make the Happy Path Easy](./ergonomics.md)                            | Experimental | Ergonomic helpers that preserve structured concurrency semantics  |
| [Keep PRs Focused](./focused-prs.md)                                   | Experimental | No mixing feature changes with formatting/refactors               |

## Policy Relationships

Some policies are closely related or intentionally create productive tension:

```text
Lifecycle & Concurrency (core)
├── Structured Concurrency ──────► foundation for lifecycle patterns
│   ├── Deterministic Tests ─────► extends No-Sleep Test Sync
│   ├── Correctness Invariants ──► tests success/error/halt paths
│   ├── Composable Units ────────► uses resource() for teardown
│   └── Async Teardown ──────────► ensure() for cleanup that yields

API Design (balance)
├── Minimal APIs ◄──── tension ────► Ergonomics
└── Documentation ◄─── supports ───► Backwards Compatibility

Code Quality
├── Type-Driven Design ◄── complements ──► Correctness Invariants
└── Naming Consistency ──► supports all policies
```

## Adding a New Policy

1. Copy [template.md](./template.md) to a new file (e.g., `my-policy.md`)
2. Fill in all sections following the template structure
3. Add an entry to the **Policy Documents** table above
4. Set the appropriate state (Strict, Recommended, or Experimental)
5. Add cross-references to related policies in the Core Principle section
