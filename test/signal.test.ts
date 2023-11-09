import { describe, expect, it } from "./suite.ts";
import {
  createQueue,
  createScope,
  createSignal,
  each,
  run,
  SignalQueueFactory,
  spawn,
} from "../mod.ts";

describe("createSignal", () => {
  it("should send and receive messages", async () => {
    let msgs: string[] = [];
    let signal = createSignal<string, void>();
    let root = run(function* () {
      let task = yield* spawn(function* () {
        for (let msg of yield* each(signal)) {
          msgs.push(msg);
          yield* each.next();
        }
      });

      signal.send("msg1");
      signal.send("msg2");
      signal.close();
      yield* task;
    });

    await root;

    expect(msgs).toEqual(["msg1", "msg2"]);
  });

  it("should use custom Queue impl", async () => {
    // drop every other message
    function createDropQueue() {
      let counter = 0;
      let queue = createQueue<string, void>();
      return {
        ...queue,
        add(value: string) {
          counter += 1;
          if (counter % 2 === 0) {
            return;
          }

          queue.add(value);
        },
      };
    }

    let msgs: string[] = [];
    let [scope] = createScope();
    scope.set(SignalQueueFactory, createDropQueue);
    let signal = createSignal<string, void>();

    let root = scope.run(function* () {
      let task = yield* spawn(function* () {
        for (let msg of yield* each(signal)) {
          msgs.push(msg);
          yield* each.next();
        }
      });

      signal.send("msg1");
      signal.send("msg2");
      signal.send("msg3");
      signal.send("msg4");
      signal.send("msg5");
      signal.close();
      yield* task;
    });

    await root;

    expect(msgs).toEqual(["msg1", "msg3", "msg5"]);
  });
});
