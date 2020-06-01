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
