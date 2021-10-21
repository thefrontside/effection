import { TaskTree, Operation, Labels, Task, State, Stream, StateTransition, Subscription, on, spawn, createStream } from 'effection';

type Start = {
  type: 'start';
  task: TaskTree;
}

type LinkChild = {
  type: 'link';
  id: number;
  child: TaskTree;
}

type UnlinkChild = {
  type: 'unlink';
  id: number;
  childId: number;
}

type StateChange = {
  type: 'state';
  id: number;
  state: State;
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

export type InspectMessage = Start | LinkChild | UnlinkChild | StateChange | LabelsChange | YieldingToChange;

function streamTask(task: Task, publish: (message: InspectMessage) => void): Operation<void> {
  return function*(scope) {
    function* linkChild(child: Task) {
      yield spawn(streamTask(child, publish));
      yield on(task, 'unlink').match({ id: child.id }).expect();
      publish({ type: 'unlink', id: task.id, childId: child.id });
    }

    for(let child of task.children) {
      yield scope.spawn(linkChild(child));
    }

    yield spawn(on<Task>(task, 'link').forEach(function*(child) {
      publish({ type: 'link', id: task.id, child: child.toJSON() });
      yield scope.spawn(linkChild(child));
    }));

    yield spawn(on<StateTransition>(task, 'state').forEach(function*(transition) {
      publish({ type: 'state', id: task.id, state: transition.to });
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

    yield;
  };
}

export function inspect(rootTask: Task): Stream<InspectMessage> {
  return createStream(function*(publish) {
    publish({ type: 'start', task: rootTask.toJSON() });
    yield streamTask(rootTask, publish);
    return undefined;
  });
}
