---
id: debugging
title: Debugging
---

> COMING SOON! The debugger is a work in progress, and this guides describes
> how the debugger will work eventually.

We have created a powerful visual debugger which is available both as a browser
extension for web applications which use Effection, and as a standalone
debugger for node applications.

## Using the browser extension

The browser extension is unfortunately not yet available from the chrome
and firefox extension stores. To build it manually, see the [devtools][]
package in the Effection repo on GitHub.

Once you have the browser extension installed, you will need to install the
`@effection/debug` package.

```
npm install @effection/debug
```

We recommend importing this package in the entry point of your application
(for example `src/index.js` or similar):

```
import '@effection/debug'
```

Just importing the package is enough.

If you start your application and open up the web inspector in your browser you
should now see a new "Effection" panel. Here you can see a tree view of all
currently running Effection tasks.

## Using the node debugger

Install the `@effection/debug` package:

```
npm install @effection/debug
```

You will need to import this package, and there are two main options that we
recommend for doing so.

The first option is to import it from the entry point of your application (for
example `src/index.js` or similar):

```
import '@effection/debug'
```

The second option is to run your `node` command with `-r @effection/debug`:

```
node -r @effection/debug src/index.js
```

Once your application starts, you should see Effection print a message like this:

```
[effection] debugger available on http://localhost:34556
```

Open the URL in a browser and you should see the visual debugger.

## Using labels

When using the visual debugger, we would like to be able to distinguish tasks
from each other, as well as seeing metadata about the tasks. We can do this
by applying labels.

Labels are key/value pairs, the key must be a string and the value must be a
string, number or boolean.

Labels also improve the "Effection trace" shown when an error occurs if you are
using `main`, so even if you aren't using the visual debugger, adding some labels
can make Effection code easier to debug.

We can apply labels when spawning a task:

``` javascript
import { run } from 'effection';

run(fetchWeekDay('cet'), {
  labels: {
    name: 'fetchWeekDay',
    timezone: 'cet'
  }
});
```

Or using `spawn`:

``` javascript
import { main, spawn } from 'effection';

main(function*() {
  yield spawn(fetchWeekDay('cet'), {
    labels: {
      name: 'fetchWeekDay',
      timezone: 'cet'
    }
  });
});
```

Or we can set labels on an operation by using the `withLabels` function:

``` javascript
import { main, withLabels } from 'effection';

main(function*() {
  yield withLabels(fetchWeekDay('cet'), {
    name: 'fetchWeekDay',
    timezone: 'cet'
  });
});
```

We could rewrite our `fetchWeekDay` operation to do this automatically for us:

``` javascript
import { withLabels } from 'effection';
import { fetch } from '@effection/fetch';

export function fetchWeekDay(timezone) {
  return withLabels(function*() {
    let response = yield fetch(`http://worldclockapi.com/api/json/${timezone}/now`);
    let time = yield response.json();
    return time.dayOfTheWeek;
  }, { name: 'fetchWeekDay', timezone });
}
```

This way, wherever we use `fetchWeekDay` it would be nicely labeled and easily
identifiable in the visual debugger.

## Dynamic labels

Another way of setting labels is through the `label` operation. This operation makes
it possible to set labels while the task is running:

``` javascript
import { once, label } from 'effection';

function *runSocketServer() {
  let socket = new WebSocket('ws://localhost:1234');

  yield label({ state: 'pending' });

  yield once(socket, 'open');

  yield label({ state: 'open' });

  console.log('socket is open!');

  let closeEvent = yield once(socket, 'close');

  yield label({ state: 'closed' });
  console.log('socket closed with code', closeEvent.code);
};
```

This can give you some insight into the current state of a task.

## Function names

A final trick is that if our operation is a generator *function*, then we can name the
function to automatically set the `name` label:

``` javascript
import { withLabels } from 'effection';
import { fetch } from '@effection/fetch';

export function fetchWeekDay(timezone) {
  return function* fetchWeekDay() {
    let response = yield fetch(`http://worldclockapi.com/api/json/${timezone}/now`);
    let time = yield response.json();
    return time.dayOfTheWeek;
  }
}
```

Unfortunately, there is no way to obtain the name of the generator *function*
from a `Generator`, so the following does *not* set any labels:

``` javascript
import { withLabels } from 'effection';
import { fetch } from '@effection/fetch';

export function *fetchWeekDay(timezone) {
  let response = yield fetch(`http://worldclockapi.com/api/json/${timezone}/now`);
  let time = yield response.json();
  return time.dayOfTheWeek;
}
```

[devtools]: https://github.com/thefrontside/effection/tree/v2/packages/devtools
