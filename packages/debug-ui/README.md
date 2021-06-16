# @effection/debug-ui

This provides a UI for debugging Effection applications, written in React. This
package is normally not used directly, but is bundled by the
`@effection/debug-server` package and the Effection devtools.

## Development

You will need a debug server to connect to, start the example in the `@effection/debug-server` package:

```
cd ../debug-server
yarn examples:basic
```

Then you can start the UI:

```
yarn start
```

Now connect to the UI via <http://localhost:1234/?port=47000>
