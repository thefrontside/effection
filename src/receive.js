import { Fork } from './fork';
import { patternMatch } from './pattern-match';

export function receive(target, match) {
  if(target && !(target instanceof Fork)) {
    match = target;
    target = undefined;
  }

  return (execution) => {
    if(!target) {
      target = execution;
    }

    function scanMailbox() {
      let index = target.mailbox.findIndex((message) => patternMatch(match)(message));
      if(index >= 0) {
        let [message] = target.mailbox.splice(index, 1);
        execution.resume(message);
      }
    }

    scanMailbox();

    target.on("message", scanMailbox);
    return () => {
      target.off("message", scanMailbox);
    };
  };
}
