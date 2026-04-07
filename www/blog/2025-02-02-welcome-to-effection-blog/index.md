---
title: "Welcome to the Effection Blog"
description: "Introducing the new Effection blog - your source for tutorials, release announcements, and insights about structured concurrency in JavaScript."
author: "Taras Mankovski"
tags: ["announcement", "effection"]
image: meta-effection.png
---

Welcome to the official Effection blog! This is where we'll share tutorials,
announcements, and deep dives into structured concurrency in JavaScript.

## What to Expect

We're planning to cover a variety of topics:

- **Tutorials**: Step-by-step guides for using Effection in your projects
- **Release Announcements**: New version highlights and migration guides
- **Deep Dives**: Technical explorations of structured concurrency patterns
- **Ecosystem Updates**: News about integrations and community projects

## Getting Started with Effection

If you're new to Effection, here's a quick taste of what structured concurrency
looks like:

```typescript
import { main, sleep, spawn } from "effection";

await main(function* () {
  // Spawn concurrent tasks
  yield* spawn(function* () {
    yield* sleep(1000);
    console.log("Task 1 complete");
  });

  yield* spawn(function* () {
    yield* sleep(500);
    console.log("Task 2 complete");
  });

  // Both tasks are automatically cleaned up when main exits
  yield* sleep(2000);
  console.log("All done!");
});
```

The key insight is that **all spawned tasks are owned by their parent scope**.
When the parent completes, all children are automatically cleaned up. No more
forgotten timers, dangling promises, or resource leaks.

## Why Structured Concurrency?

Traditional async/await in JavaScript has a fundamental problem: **promises are
eager and unstructured**. When you create a promise, work starts immediately and
continues even if nothing is listening for the result.

Effection's operations are **lazy** - they only execute when you `yield*` them.
And they're **structured** - child operations cannot outlive their parent scope.

This makes reasoning about concurrent code much easier:

- Resources are always cleaned up
- Error handling is predictable
- Testing concurrent code is straightforward
- No more "fire and forget" mistakes

## Join the Community

We'd love to hear from you! Join us on:

- [Discord](https://discord.gg/r6AvtnU) - Chat with the community
- [GitHub](https://github.com/thefrontside/effection) - Report issues and
  contribute
- [API Documentation](/api) - Explore the full API

Stay tuned for more posts. We're excited to share what we've learned about
building reliable concurrent applications in JavaScript!
