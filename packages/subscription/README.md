# @effection/subscription

APIs for producing, consuming and transforming streams of data within
effection operations.

### createSubscription(publisher)

At it's lowest level, the subscription API does not actually require
any helpers to implement, only that the subscription object itself
conform to a certain API, and that the caller respect . However, to
manually implement this API every time would be unreasonably
cumbersome. This is where `createSubscription` comes in. It returns an
operation that produces a `Subscription` from a publisher. Where
`publisher` is a fuction that takes a `publish` function and returns
an Operation that produces the return value of the subscription.

``` typescript
type Publisher<T> = (publish: (value: T) => void) => Operation<T>;
createSubscription<T, TReturn>(publisher: Publisher<T,TReturn>): Operation<Subscription<T,TReturn>>
```

the publish function is called to "push" a value out to the
subscription so that it will be returned by a subsequent call to the
`next()` operation of the subscription. Publish can be called many
times in between subsequent calls to `next` and still not lose a
value.

For example, to implement the `on` subscription for event emitters:

``` javascript
export function on(emitter, eventName) {
  return createSubscription(function* (publish) {
    let listener = (...args) => publish(args);
    try {
      emitter.on(eventName, listener);
      yield;
    } finally {
      emitter.off(eventName, listener);
    }
  });
}
```

Now, any event can be consumed as a subscription:

``` javascript
let subscription = yield on(socket, 'message');
while (true) {
  let { value: [message] } = subscription.next();
  yield handleMessage(message);
}
```

One of the greatest advantages of using `createSubscription` is that
the `Subscription` produced is an effection resource, and so will
automatically be shut down when no longer needed. That way, there is
no need to call the `unsubscribe()` method ever.

### SymbolSubscribable

In order to facilitate interoperation of subscription producers and
consumers, any object can implement the `[SymbolSubscribable]()`
method in order to be turned into a subscription. This follows the
pattern of `Symbol.iterator`, and `Symbol.observable`. Any object that
implements this method can be consumed as a subscription.

### Subscribable.from(source)

In order to lift functions into the context of a subscription, you can
use `Subscribable.from` which will return an instance of
`Subscribable` that allows you to transform a subscription produced

### Subscribable#map(fn)

Returns a new subscribable whose items are transformed by `fn`. For
example:

``` javascript
Subscribable.from(websocket).map(message => JSON.parse(message));
```

### Subscribable#filter(predicate)

Return a new `Subscribable` that only produces items from its source
that match `predicate`.

``` javascript
Subscribable.from(websocket).filter(message => message.type === 'command');
```

### Subscribable#first()

An operation that produces the first item in a subscription or
undefined if the subscription has no items.

``` javascript
let message = yield Subscribable.from(websocket).first();
```
