# @effection/channel

A multi producer, multi consumer channel for Effection. Channels are useful for
communicating between different parts of a system, for building pubsub buses, or
a whole lot of other synchronization needs.

Sending to a channel is synchronous and does not require the sender to be
running in an effection context. However, reading from a channel can only be
done through operations.

## Usage

A basic example:

``` typescript
import { createChannel } from '@effection/channel';
import { main } from '@effection/node';
import { timeout } from 'effection';

main(function*() {
  let channel = createChannel();

  spawn(function*() {
    while(true) {
      yield timeout(1000);
      channel.send({ message: "ping" });
    }
  });

  let subscription = yield channel.subscribe();

  while(true) {
    let value = yield subscription.next();
    console.log("value:", value);
  }
});
