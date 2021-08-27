import { Stream } from '@effection/subscription';
import { createChannel, ChannelOptions } from '@effection/channel';

type Close<T> = (...args: T extends undefined ? [] : [T]) => void;

export interface DuplexChannel<TReceive, TSend, TClose = undefined> extends Stream<TReceive, TClose> {
  send(message: TSend): void;
  close: Close<TClose>;
  stream: Stream<TReceive, TClose>;
}

export type DuplexChannelPair<TLeft, TRight, TClose = undefined> = [DuplexChannel<TLeft, TRight, TClose>, DuplexChannel<TRight, TLeft, TClose>]

export function createDuplexChannel<TLeft, TRight, TClose = undefined>(options: ChannelOptions = {}): DuplexChannelPair<TLeft, TRight, TClose> {
  let leftChannel = createChannel<TLeft, TClose>(options);
  let rightChannel = createChannel<TRight, TClose>(options);

  let close: Close<TClose> = (...args) => {
    leftChannel.close(...args);
    rightChannel.close(...args);
  };

  return [
    { send: rightChannel.send, stream: leftChannel.stream, close, ...leftChannel.stream },
    { send: leftChannel.send, stream: rightChannel.stream, close, ...rightChannel.stream },
  ];
}
