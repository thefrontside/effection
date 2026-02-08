# Effection Blog — Writing Agent Guide

This file defines how to write blog posts for the Effection website
(`www/blog/`). It covers voice, structure, and technical accuracy constraints.

The Effection blog is distinct from the Frontside company blog. Posts here are
shorter, more focused, and always grounded in what Effection actually does.

## File Conventions

- **Directory pattern:** `www/blog/YYYY-MM-DD-slug/index.md`
- **Slug format:** lowercase, hyphen-separated, derived from title
- **Images:** placed in the same directory as the post's `index.md`
- **Frontmatter:**

```yaml
---
title: "The Title of the Post"
description: "A 1-2 sentence pitch that makes someone want to read the post."
author: "Author Name"
tags: ["tag1", "tag2"]
image: "featured-image.svg"
---
```

- The title is NOT repeated as an `# H1` inside the post body.
- Tags are lowercase strings, typically 1-3.
- Image paths are relative to the post directory.

## Voice

### Primary author: Taras Mankovski

The default voice for Effection blog posts is Taras'. Here's how it works.

**Register:** Clean, direct prose. Not academic, not marketing. Technically
precise but accessible. The authority comes from having built the thing, not
from credentials.

**Goal:** Make the reader understand that Effection makes async feel normal.
That's the core message. Everything else supports it.

**Point of view:**

- First person singular ("I") for opinion and advocacy posts.
- First person plural ("we") for project announcements and release notes.
- Second person ("you") when addressing the reader's situation.
- Mix all three when a post is both advocating and explaining.

**Prose style:**

- Clean prose mostly. Every sentence earns its place.
- Metaphors and color are welcome when they serve the argument — don't force
  them, but don't strip them out either. If a reviewer adds a good metaphor
  during editing, keep it.
- No filler. No "In today's rapidly evolving landscape" openings. No padding.
- Short posts (500-800 words). Get in, make the point, get out.

**Opening style:**

- Prefer grounding technical arguments in history or foundational context first,
  then connecting to today. The goal is to show that the idea is fundamental,
  not novel.
- Don't lead with "Effection is..." — lead with the problem or the principle.

**Code:**

- Light: 1-3 well-chosen snippets per post.
- Code reinforces the argument. It's evidence, not tutorial steps.
- Show the Effection way. Don't show verbose "before" code unless the contrast
  is the point.

**Citations and links:**

- Link non-obvious claims inline. Common knowledge stays unlinked.
- Link to Effection docs when referencing specific features.
- Link to other Effection blog posts when they exist on the topic.
- Link to authoritative external sources (specs, foundational blog posts, docs).

**Naming alternatives:**

- Name other projects (Effect.ts, Observables, Kotlin coroutines, etc.) to
  validate that structured concurrency is a real, growing movement.
- Do NOT position Effection against them or compare features. The goal is "these
  exist too" not "we're better than X."

**Conclusions:**

- Brief: 1-3 sentences.
- Never a recap or summary of what was covered.
- Either a forward-looking statement, a CTA to try Effection, or a return to the
  opening idea.

### Style reference: Charles Lowell (edited result)

When writing as Taras, aim for the quality of a post that has been reviewed and
polished by Charles Lowell — essayistic touches, sustained metaphors when they
work, sudden casual lines after formal argument. The agent should produce
something close to the final edited result, not a raw draft that needs heavy
review.

## What the Blog is NOT

- **Not academic** — no jargon for jargon's sake, no passive voice
- **Not marketing** — no "game-changer", "revolutionary", "best-in-class"
- **Not a tutorial site** — posts argue or explain; step-by-step guides belong
  in `/docs/`
- **Not padded** — every sentence earns its place
- **Not emoji-heavy** — avoid emoji in prose

## Technical Accuracy

This is non-negotiable. The Effection blog teaches people how to think about
structured concurrency. Wrong examples teach wrong patterns.

**Before writing any code example:**

- Consult the root `AGENTS.md` for API correctness constraints.
- Do NOT use `await` inside a generator function. Use `yield*`.
- Do NOT call `spawn()` without `yield*` — `spawn()` returns an Operation, not a
  Task.
- Do NOT claim promises are "inert until awaited" — they are eager.
- Do NOT invent APIs. If you're unsure whether something exists, check the API
  reference: https://frontside.com/effection/api/

**After writing any code example:**

- Verify imports match the actual Effection public API.
- Verify the example would actually work if pasted into a file and run.
- Check that `try/finally` patterns match the `resource()` and `ensure()`
  conventions documented in the root `AGENTS.md`.

## Writing Checklist

### Before writing:

- [ ] Identify the core argument — what should the reader walk away believing?
- [ ] Search `www/blog/` for related existing posts to cross-reference
- [ ] Determine POV: personal ("I") or project ("we")

### During writing:

- [ ] Open with context or a problem, not with "Effection is..."
- [ ] Keep paragraphs to 3-5 sentences
- [ ] Include 1-3 code snippets that reinforce the argument
- [ ] Link to Effection docs for any feature mentioned
- [ ] Link non-obvious claims to sources
- [ ] Stay under 800 words

### After writing:

- [ ] Conclusion is brief and is NOT a summary
- [ ] No marketing-speak crept in
- [ ] All code examples are correct per the root `AGENTS.md`
- [ ] Frontmatter is complete: title, description, author, tags, image
- [ ] File is at `www/blog/YYYY-MM-DD-slug/index.md`
- [ ] Run `deno fmt` and `deno lint`
