# @effection/inspect-ui

This provides a UI for inspecting Effection applications, written in React. This
package is normally not used directly, but is bundled by the
`@effection/inspect-server` package and the Effection devtools.

## Development

You will need a inspect server to connect to, start the example in the `@effection/inspect-server` package:

```
cd ../inspect-server
yarn examples:basic
```

Then you can start the UI:

```
yarn start
```

Now connect to the UI via <http://localhost:1234/?port=47000>
