/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { main, fork, send, receive, any } from '../src/index';

async function suspend() {}

describe('Send and Receive Messages', () => {
  describe('receive with no arguments', () => {
    let execution, message;

    beforeEach(() => {
      execution = main(function*() {
        message = yield receive();
      });
    });

    it('blocks until a message is sent', async () => {
      expect(message).toEqual(undefined);

      await suspend();

      execution.spawn(send("hello"));
      await suspend();

      expect(message).toEqual("hello");
    });
  });

  describe('receive with an execution as argument', () => {
    let execution, message;

    beforeEach(() => {
      execution = main(function*() {
        let target = yield ({ resume, context: { parent }}) => resume(parent);
        main(function*() {
          message = yield receive(target);
        });
      });
    });

    it('blocks until a message is sent to the given execution', async () => {
      expect(message).toEqual(undefined);

      await suspend();

      execution.spawn(send("hello"));
      await suspend();

      expect(message).toEqual("hello");
    });
  });

  describe('receive with a pattern argument', () => {
    let execution, message;

    beforeEach(() => {
      execution = main(function*() {
        message = yield receive({ some: any("string") });
      });
    });

    it('ignores messages which does not match', async () => {
      execution.spawn(send({ another: "one" }));
      await suspend();
      expect(message).toEqual(undefined);
    });

    it('receives matching messages', async () => {
      execution.spawn(send({ some: "thing" }));
      await suspend();
      expect(message.some).toEqual("thing");
    });

    it('leaves non matching message in inbox for later retrieval', async () => {
      execution.spawn(send({ first: "message" }));
      execution.spawn(send("another"));
      execution.spawn(send({ some: "thing" }));
      let [one, two] = await main(function*() {
        let one = yield receive(execution);
        let two = yield receive(execution);
        return [one, two];
      });
      expect(one.first).toEqual("message");
      expect(two).toEqual("another");
    });
  });

  describe('receive with both exection and pattern argument', () => {
    let execution, message;

    beforeEach(() => {
      execution = main(function*() {
        let target = yield ({ resume, context: { parent }}) => resume(parent);
        yield fork(function *() {
          message = yield receive({ some: any("string") }, target);
        });
      });
    });

    it('ignores messages which does not match', async () => {
      execution.spawn(send({ another: "one" }));
      await suspend();
      expect(message).toEqual(undefined);
    });

    it('receives matching messages', async () => {
      execution.spawn(send({ some: "thing" }));
      await suspend();
      expect(message.some).toEqual("thing");
    });
  });
});
