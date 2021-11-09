import { Resource, Operation, Subscription, Task, State, TaskInfo, spawn } from 'effection';
import { createDispatch, Dispatch } from '@effection/dispatch';
import { createAtom, Slice } from '@effection/atom';

import { InspectMessage, SerializedError } from './inspect';

export interface InspectState extends TaskInfo {
  error?: SerializedError;
  yieldingTo?: InspectState;
  children: InspectState[];
}

function isFinished(state: State): boolean {
  return state === 'completed' || state === 'halted' || state === 'errored';
}

function* taskState(taskSlice: Slice<InspectState>, dispatch: Dispatch<number, InspectMessage>): Operation<void> {
  let task = taskSlice.get();
  // if the task is already done, we don't need to subscribe
  if(!task || isFinished(task.state)) {
    return;
  }

  try {
    let subscription = dispatch.get(task.id);
    let yieldingToTask: Task | undefined;

    for(let [index,] of task.children.entries()) {
      yield spawn(taskState(taskSlice.slice('children', index), dispatch));
    }

    if(task.yieldingTo) {
      yieldingToTask = yield spawn(taskState(taskSlice.slice('yieldingTo') as Slice<InspectState>, dispatch));
    }

    while(true) {
      let next: IteratorResult<InspectMessage> = yield subscription.next();
      if(next.done) {
        return;
      } else {
        let message: InspectMessage = next.value;

        if(message.type === 'link') {
          let child = message.child;
          taskSlice.slice('children').update((c) => [...c, child]);
          yield spawn(taskState(taskSlice.slice('children', taskSlice.slice('children').get().length - 1), dispatch));
        } else if (message.type === 'labels') {
          taskSlice.slice('labels').set(message.labels);
        } else if (message.type === 'yieldingTo') {
          yieldingToTask?.halt();
          taskSlice.slice('yieldingTo').set(message.task);
          if(message.task) {
            yieldingToTask = yield spawn(taskState(taskSlice.slice('yieldingTo') as Slice<InspectState>, dispatch));
          }
        } else if (message.type === 'state') {
          taskSlice.slice('state').set(message.state);
          taskSlice.slice('error').set(message.error);
          // if the task is complete, there is no point in listening for further events
          if(isFinished(message.state)) {
            return;
          }
        }
      }
    }
  } finally {
    dispatch.closeKey(task.id);
  }
}

export function inspectState(subscription: Subscription<InspectMessage>): Resource<Slice<InspectState>> {
  return {
    *init() {
      let startMessage: InspectMessage = yield subscription.expect();

      if(startMessage.type === 'start') {
        let atom = createAtom(startMessage.task);
        let dispatch = createDispatch<number, InspectMessage>();

        yield spawn(taskState(atom, dispatch));
        yield spawn(subscription.forEach(function*(message) {
          if(message.type !== 'start') {
            dispatch.send(message.id, message);
          }
        }));

        return atom;
      } else {
        throw new Error(`the first message must be a start message, got ${startMessage.type}`);
      }
    }
  };
}
