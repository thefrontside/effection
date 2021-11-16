---
id: inspector
title: Inspector
---

We have created a powerful visual inspector for Effection. The inspector can
show you which tasks are currently running. You can click on a task to focus in
on it, see which tasks completed or failed and more.

![The Visual Inspector](/images/inspector-screenshot.png)

## Using the node inspector

Install the `@effection/inspect` package:

```
npm install @effection/inspect --save-dev
```

You will need to import this package, and there are two main options that we
recommend for doing so.

The first option is to import it from the entry point of your application (for
example `src/index.js` or similar):

```
import '@effection/inspect'
```

The second option is to run your `node` command with `-r @effection/inspect`:

```
node -r @effection/inspect src/index.js
```

Once your application starts, you should see Effection print a message like this:

```
[effection] inspector available on http://localhost:34556
```

Open the URL in a browser and you should see the visual inspector.

## Improving the output

To clarify the output produced by the inspector it can be very helpful to add
[labels][] to your tasks.

[labels]: /docs/guides/labels
[devtools]: https://github.com/thefrontside/effection/tree/v2/packages/devtools
