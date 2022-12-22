import { TaskTree, Operation, Labels, Task, State, Stream, StateTransition, Subscription, on, spawn, createStream } from 'effection';

export type SerializedError = {
  name: string,
  message: string,
  stack: string,
}

type Start = {
  type: 'start';
  task: TaskTree;
}

type LinkChild = {
  type: 'link';
  id: number;
  child: TaskTree;
}

type StateChange = {
  type: 'state';
  id: number;
  state: State;
  error?: SerializedError;
}

type LabelsChange = {
  type: 'labels';
  id: number;
  labels: Labels;
}

type YieldingToChange = {
  type: 'yieldingTo';
  id: number;
  task: TaskTree | undefined;
}

function isFinished(state: State): boolean {
  return state === 'completed' || state === 'halted' || state === 'errored';
}

export type InspectMessage = Start | LinkChild | StateChange | LabelsChange | YieldingToChange;

function streamTask(task: Task, publish: (message: InspectMessage) => void): Operation<void> {
  return function*(scope) {
    function* linkChild(child: Task) {
      yield streamTask(child, publish);
    }

    for(let child of task.children) {
      yield scope.spawn(linkChild(child));
    }

    yield spawn(on<Task>(task, 'link').forEach(function*(child) {
      publish({ type: 'link', id: task.id, child: child.toJSON() });
      yield scope.spawn(linkChild(child));
    }));

    yield spawn(on<Labels>(task, 'labels').forEach(function*(labels) {
      publish({ type: 'labels', id: task.id, labels });
    }));

    yield spawn(function*() {
      let subscription: Subscription<Task> = yield on<Task>(task, 'yieldingTo');
      let current: Task | undefined = task.yieldingTo;

      while(true) {
        yield function*() {
          if(current) {
            yield spawn(streamTask(current, publish));
          }
          current = yield subscription.expect();
          publish({ type: 'yieldingTo', id: task.id, task: current?.toJSON() });
        };
      }
    });

    let states: Stream<StateTransition> = yield on<StateTransition>(task, 'state');

    while(true) {
      let transition: StateTransition = yield states.expect();
      let error: SerializedError | undefined;
      if(transition.to === 'errored') {
        try {
          yield task;
        } catch(error) {
          let { name, message, stack } = error as Error;
          error = { name, message, stack };
        }
      }
      publish({ type: 'state', id: task.id, state: transition.to, error });
      if(isFinished(transition.to)) {
        return;
      }
    }
  };
}

export function inspect(rootTask: Task): Stream<InspectMessage> {
  return createStream(function*(publish) {
    publish({ type: 'start', task: rootTask.toJSON() });
    yield streamTask(rootTask, publish);
    return undefined;
  });
}
