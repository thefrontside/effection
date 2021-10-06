import { Operation } from '@effection/core';
import { Stream, createStream } from '@effection/stream';

export type Callback<T,TReturn> = (publish: (value: T) => Operation<void>) => Operation<TReturn>;

export interface OutputStream extends Stream<Buffer> {
  text(): Stream<string>;
  lines(): Stream<string>;
}

export function createOutputStream(callbackOrStream: Stream<Buffer> | Callback<Buffer, undefined>, name = 'iostream'): OutputStream {
  let stream: Stream<Buffer>;
  if(typeof(callbackOrStream) === 'function') {
    stream = createStream<Buffer, undefined>(callbackOrStream, name);
  } else {
    stream = callbackOrStream;
  }

  return Object.assign(stream, {
    text() {
      return stream.map((c) => c.toString());
    },
    lines() {
      return createStream<string, undefined>(function*(publish) {
        let current = "";
        yield stream.forEach(function*(chunk) {
          let lines = (current + chunk.toString()).split('\n');
          for(let line of lines.slice(0, -1)) {
            yield publish(line);
          }
          current = lines.slice(-1)[0];
        });

        if(current) {
          yield publish(current);
        }

        return undefined;
      }, name);
    }
  });
}
