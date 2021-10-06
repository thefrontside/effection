import { TaskInfo, Operation, Labels, Task, Resource, spawn, StateTransition } from '@effection/core';
import { on } from '@effection/events';
import { Subscription } from '@effection/subscription';
import { createAtom, Slice } from '@effection/atom';

export interface InspectTree extends TaskInfo {
  yieldingTo: InspectTree | undefined;
  children: Record<string, InspectTree>;
}

function serialize(task: Task): InspectTree {
  return {
    id: task.id,
    type: task.type,
    labels: task.labels,
    state: task.state,
    yieldingTo: task.yieldingTo && serialize(task.yieldingTo),
    children: Object.fromEntries(task.children.map((c) => [c.id, serialize(c)])),
  };
}

export function inspect(rootTask: Task): Resource<Slice<InspectTree>> {
  let inspectTreeTask = (task: Task, slice: Slice<InspectTree>): Operation<void> => function*(scope) {
    function* linkChild(child: Task) {
      let childSlice = slice.slice('children', child.id.toString());

      if(!childSlice.get()) {
        yield childSlice.set(serialize(child));
      }
      yield spawn(inspectTreeTask(child, childSlice));
      yield on(task, 'unlink').match({ id: child.id }).expect();
    }

    for(let child of task.children) {
      yield spawn(linkChild(child));
    }

    yield spawn(on<Task>(task, 'link').forEach(child => {
      return scope.spawn(linkChild(child)) as Operation<void>;
    }));

    yield spawn(on<StateTransition>(task, 'state').forEach(function*(transition) {
      yield slice.slice('state').set(transition.to);
    }));

    yield spawn(on<Labels>(task, 'labels').forEach(function*(labels) {
      yield slice.slice('labels').set(labels);
    }));

    yield spawn(function*() {
      let yieldingToSlice = slice.slice('yieldingTo');
      let subscription: Subscription<Task> = yield on<Task>(task, 'yieldingTo');
      let current: Task | undefined = task.yieldingTo;

      while(true) {
        yield function*() {
          if(current) {
            yield spawn(inspectTreeTask(current, yieldingToSlice as Slice<InspectTree>));
          }
          current = yield subscription.expect();
          yield yieldingToSlice.set(current ? serialize(current) : undefined);
        };
      }
    });

    yield;
  };

  return {
    *init() {
      let slice = createAtom<InspectTree>(serialize(rootTask));

      yield spawn(inspectTreeTask(rootTask, slice));

      return slice;
    }
  };
}
