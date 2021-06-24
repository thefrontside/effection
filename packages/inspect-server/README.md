# @effection/inspect-server

This is a websocket server which runs inside of a node process. An inspector can
connect to this websocket server and receive information from the node process.

The inspect server also serves up the UI provided by the
`@effection/inspect-ui` package, providing a complete inspector when integrated
into a process.

This package is usually not used directly, but rather through the
`@effection/inspect` package.

## Development

There is an example script provided in this package which can be useful for working
on the inspect server and/or the inspect ui. You can run it like this:

```
yarn examples:basic
```

This also serves the bundled UI, but for working on the UI it can be more
convenient to run the UI in watch mode so you can see changes instantly without
recompiling. See the `@effection/inspect-ui` package on how to set this up.
