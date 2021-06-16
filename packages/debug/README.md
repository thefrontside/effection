# @effection/debug

This package can be included in your application to make it debuggable. When
running in node it starts a debug server in the background, and when running in
the browser it provides hooks for the Effection devtools to hook into.

Debugging a process can add overhead and degrade performance, but this package
only starts monitoring once a debugger connects, so it should be fairly
lightweight until then.

If `NODE_ENV` is set to `production` the debugger is not included. You can
override this behaviour by setting `EFFECTION_INCLUDE_DEBUGGER=true`.

## Usage

Just importing this package will set up the debugger. For example like this:

```
node -r @effection/debug ./my-script.js
```

Or by adding it to your main entry point:

``` typescript
// ./index.js
import '@effection/debug'
// ...
```
