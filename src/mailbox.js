import { ExecutionContext } from './context';
import { compile } from './pattern';

export function send(message, target) {
  return ({ resume, context: { parent }}) => {
    if (!target) { target = parent; }

    let { messages, receivers } = target.mailbox;

    for (let receiver of receivers) {
      if (receiver.match(message)) {
        receiver.resume(message);
        resume();
        return;
      }
    }
    // no match, so add it to the queue
    messages.add(message);
    resume();
  };
}

export function receive(pattern, target) {
  if (pattern instanceof ExecutionContext) {
    target = pattern;
    pattern = undefined;
  }

  let match = compile(pattern);

  return ({ resume, ensure, context: { parent } }) => {
    if (!target) { target = parent; }

    let { messages, receivers } = target.mailbox;

    for (let message of messages) {
      if (match(message)) {
        messages.delete(message);
        resume(message);
        return;
      }
    }

    // no match, so add it to the queue
    let receiver = { match, resume };
    receivers.add(receiver);
    ensure(() => receivers.delete(receiver));
  };
}
