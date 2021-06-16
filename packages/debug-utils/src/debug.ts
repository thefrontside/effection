import { TaskInfo, Operation, Labels, Task, Resource, spawn, StateTransition } from '@effection/core';
import { on } from '@effection/events';
import { Subscription } from '@effection/subscription';
import { createAtom, Slice } from '@effection/atom';

export interface DebugTree extends TaskInfo {
  yieldingTo: DebugTree | undefined;
  children: Record<string, DebugTree>;
}

function serialize(task: Task): DebugTree {
  return {
    id: task.id,
    type: task.type,
    labels: task.labels,
    state: task.state,
    yieldingTo: task.yieldingTo && serialize(task.yieldingTo),
    children: Object.fromEntries(task.children.map((c) => [c.id, serialize(c)])),
  }
}

export function debug(rootTask: Task): Resource<Slice<DebugTree>> {
  let debugTreeTask = (task: Task, slice: Slice<DebugTree>): Operation<void> => function*(scope) {
    function* linkChild(child: Task) {
      let childSlice = slice.slice('children', child.id.toString());

      if(!childSlice.get()) {
        childSlice.set(serialize(child));
      }
      yield spawn(debugTreeTask(child, childSlice));
      yield on(task, 'unlink').match({ id: child.id }).expect();
    }

    for(let child of task.children) {
      yield spawn(linkChild(child));
    }

    yield spawn(on<Task>(task, 'link').forEach((child) => {
      scope.spawn(linkChild(child));
    }));

    yield spawn(on<StateTransition>(task, 'state').forEach((transition) => {
      slice.slice('state').set(transition.to);
    }));

    yield spawn(on<Labels>(task, 'labels').forEach((labels) => {
      slice.slice('labels').set(labels);
    }));

    yield spawn(function*() {
      let yieldingToSlice = slice.slice('yieldingTo');
      let subscription: Subscription<Task> = yield on<Task>(task, 'yieldingTo');
      let current: Task | undefined = task.yieldingTo;

      while(true) {
        yield function*() {
          if(current) {
            yield spawn(debugTreeTask(current, yieldingToSlice as Slice<DebugTree>));
          }
          current = yield subscription.expect();
          yieldingToSlice.set(current ? serialize(current) : undefined);
        }
      }
    });

    yield;
  }

  return {
    *init() {
      let slice = createAtom<DebugTree>(serialize(rootTask));

      yield spawn(debugTreeTask(rootTask, slice));

      return slice;
    }
  }
}
