import { all } from '@effection/core';
import type { Sink, Close } from '@effection/subscription';
import type { Stream } from '@effection/stream';
import { createChannel, ChannelOptions } from '@effection/channel';

export interface DuplexChannel<TReceive, TSend, TClose = undefined> extends Stream<TReceive, TClose>, Sink<TSend, TClose> {
  stream: Stream<TReceive, TClose>;
}

export type DuplexChannelPair<TLeft, TRight, TClose = undefined> = [DuplexChannel<TLeft, TRight, TClose>, DuplexChannel<TRight, TLeft, TClose>]

export function createDuplexChannel<TLeft, TRight, TClose = undefined>(options: ChannelOptions = {}): DuplexChannelPair<TLeft, TRight, TClose> {
  let leftChannel = createChannel<TLeft, TClose>(options);
  let rightChannel = createChannel<TRight, TClose>(options);

  let close = function*(value: TClose) {
    yield all([
      leftChannel.close(value),
      rightChannel.close(value),
    ]);
  } as Close<TClose>;

  return [
    { send: rightChannel.send, stream: leftChannel.stream, close, ...leftChannel.stream },
    { send: leftChannel.send, stream: rightChannel.stream, close, ...rightChannel.stream },
  ];
}
