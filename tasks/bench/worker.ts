import {
  createQueue,
  each,
  on,
  type Operation,
  resource,
  spawn,
  type Stream,
} from "../../mod.ts";

export interface WorkerResource<TSend, TRecv> {
  errors: Stream<ErrorEvent, never>;
  messageerrors: Stream<MessageEvent, never>;
  messages: Stream<MessageEvent<TRecv>, never>;
  postMessage(message: TSend): Operation<void>;
}

export function useWorker<TSend, TRecv>(
  url: string,
): Operation<WorkerResource<TSend, TRecv>> {
  return resource(function* (provide) {
    let worker = new Worker(url, { type: "module" });
    try {
      yield* provide({
        errors: on(worker, "error"),
        messageerrors: on(worker, "messageerror"),
        messages: on(worker, "message"),
        *postMessage(value) {
          worker.postMessage(value);
        },
      });
    } finally {
      worker.terminate();
    }
  });
}

export function messages<T>(): Stream<T, never> {
  return resource(function* (provide) {
    let queue = createQueue<T, never>();

    yield* spawn(function* () {
      for (let event of yield* each(on(self, "message"))) {
        queue.add(event.data);
        yield* each.next();
      }
    });

    yield* provide(queue);
  });
}
