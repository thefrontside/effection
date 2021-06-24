# @effection/inspect

This package can be included in your application to make it inspectable. When
running in node it starts an inspect server in the background, and when running in
the browser it provides hooks for the Effection devtools to hook into.

Inspecting a process can add overhead and degrade performance, but this package
only starts monitoring once a inspector connects, so it should be fairly
lightweight until then.

If `NODE_ENV` is set to `production` the inspector is not included. You can
override this behaviour by setting `EFFECTION_INCLUDE_INSPECTOR=true`.

## Usage

Just importing this package will set up the inspector. For example like this:

```
node -r @effection/inspect ./my-script.js
```

Or by adding it to your main entry point:

``` typescript
// ./index.js
import '@effection/inspect'
// ...
```
