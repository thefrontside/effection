import { Stream, Callback, createStream } from './stream';

export interface IoStream extends Stream<Buffer> {
  text(): Stream<string>;
  lines(): Stream<string>;
}

export function createIoStream(callbackOrStream: Stream<Buffer> | Callback<Buffer, undefined>, name = 'iostream'): IoStream {
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
          lines.slice(0, -1).forEach(publish);
          current = lines.slice(-1)[0];
        });

        if(current) {
          publish(current);
        }

        return undefined;
      }, name);
    }
  });
}
