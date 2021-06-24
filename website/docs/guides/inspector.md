---
id: inspector
title: Inspector
---

> COMING SOON! The inspector is a work in progress, and this guides describes
> how the inspector will work eventually.

We have created a powerful visual inspector which is available both as a browser
extension for web applications which use Effection, and as a standalone
inspector for node applications.

![The Visual Inspector](/images/inspector-screenshot.png)

## Using the browser extension

The browser extension is unfortunately not yet available from the chrome
and firefox extension stores. To build it manually, see the [devtools][]
package in the Effection repo on GitHub.

Once you have the browser extension installed, you will need to install the
`@effection/inspect` package.

```
npm install @effection/inspect
```

We recommend importing this package in the entry point of your application
(for example `src/index.js` or similar):

```
import '@effection/inspect'
```

Just importing the package is enough.

If you start your application and open up the web inspector in your browser you
should now see a new "Effection" panel. Here you can see a tree view of all
currently running Effection tasks.

## Using the node inspector

Install the `@effection/inspect` package:

```
npm install @effection/inspect
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
