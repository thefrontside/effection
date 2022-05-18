/* eslint-disable @typescript-eslint/no-explicit-any, prefer-let/prefer-let */

import type { Operation, Resource, Task, Labels } from 'effection';
import { createFuture } from 'effection';

type ChildName = string;
type ChildTask = Task;

export type Strategy = 'oneForOne' | 'oneForAll' | 'restForOne';
export type Shutdown = 'never' | 'anySignificant' | 'allSignificant';

export type SupervisorOptions = {
  strategy?: Strategy;
  shutdown?: Shutdown;
};

export type ChildType = 'permanent' | 'transient' | 'temporary';

export type ChildSpecification<TArgs extends any[]> = {
  name: ChildName;
  run: (...args: TArgs) => Operation<any>;
  args?: TArgs;
  type?: ChildType;
  significant?: boolean;
  labels?: Labels;
}

export interface Supervisor {
  specs: ChildSpecification<any[]>[],
  children: Task[],
  getSpec(name: ChildName): ChildSpecification<any[]> | undefined;
  getChild(name: ChildName): ChildTask | undefined;
  addChild(child: ChildSpecification<any[]>): ChildTask;
  startChild(name: ChildName): ChildTask;
  haltChild(name: ChildName): Task<void>;
  haltAndRemoveChild(name: ChildName): Task<void>;
  restartChild(name: ChildName): Task<ChildTask>;
  halt(): Promise<void>;
  resourceTask: Task;
}

function isLive(task?: Task): boolean {
  return task ? (task.state === 'running' || task.state === 'pending') : false;
}

export function createSupervisor(specs: ChildSpecification<any[]>[] = [], options: SupervisorOptions = {}): Resource<Supervisor> {
  return {
    *init(resourceTask) {
      let children: Map<ChildName, { task?: Task, spec: ChildSpecification<any[]>, reaped: boolean }> = new Map(specs.map((spec) => [spec.name, { spec, reaped: false }]));

      function addChild(spec: ChildSpecification<any[]>) {
        if(!children.has(spec.name)) {
          children.set(spec.name, { spec, reaped: false });
          return startChild(spec.name);
        } else {
          throw new Error(`child with name ${spec.name} already exists, ids must be unique within a supervisor`);
        }
      }

      function startChild(name: ChildName) {
        const child = children.get(name);
        if(!child) {
          throw new Error(`child with name ${name} does not exist`);
        }
        if(isLive(child?.task)) {
          throw new Error(`child with name ${name} has already been started`);
        }
        let childTask = resourceTask.run(child.spec.run(...(child.spec.args || [])), { ignoreError: true, labels: { name, ...child.spec.labels } });

        resourceTask.run(function*() {
          let { resolve, future } = createFuture();
          childTask.consume(resolve);
          let result = yield future;

          if(options.shutdown === 'anySignificant' && child.spec.significant) {
            resourceTask.halt();
          } else if(options.shutdown === 'allSignificant' && !Array.from(children.values()).filter((c) => c.spec.significant).map((c) => c.task).some(isLive)) {
            resourceTask.halt();
          } else {
            if(child.reaped) return; // this task is already marked for termination and will be handled by the supervisor
            let restart = Array.from(children.values());
            if(options.strategy !== 'oneForAll') {
              restart = restart.slice(restart.indexOf(child));
            }
            if(options.strategy !== 'oneForAll' && options.strategy !== 'restForOne') {
              restart = restart.slice(0, 1);
            }
            for(let sibling of restart.slice().reverse()) {
              sibling.reaped = true;
              yield haltChild(sibling.spec.name);
            }
            for(let sibling of restart) {
              if(result.state === 'errored' && (sibling.spec.type !== 'temporary')) {
                startChild(sibling.spec.name);
              }
              if((result.state === 'completed' || result.state === 'halted') && (sibling.spec.type !== 'temporary' && sibling.spec.type !== 'transient')) {
                startChild(sibling.spec.name);
              }
            }
          }
        });
        child.task = childTask;
        return childTask;
      }

      function haltChild(name: ChildName) {
        return resourceTask.run(function*() {
          let child = children.get(name);
          if(child && child.task) {
            child.reaped = true;
            return yield child.task.halt();
          } else {
            throw new Error(`child with name ${name} does not exist`);
          }
        });
      }

      function haltAndRemoveChild(name: ChildName) {
        return resourceTask.run(function*() {
          yield haltChild(name);
          children.delete(name);
        });
      }

      function restartChild(name: ChildName) {
        return resourceTask.run(function*() {
          yield haltChild(name);
          return startChild(name);
        });
      }

      for(let name of children.keys()) {
        startChild(name);
      }

      return {
        get specs() {
          return Array.from(children.values()).map((c) => c.spec);
        },
        get children() {
          return Array.from(children.values()).map((c) => c.task).filter(Boolean) as Task[];
        },
        getSpec(name) { return children.get(name)?.spec },
        getChild(name) { return children.get(name)?.task },
        addChild,
        startChild,
        haltChild,
        haltAndRemoveChild,
        restartChild,
        halt() {
          return resourceTask.halt();
        },
        resourceTask,
      };
    }
  };
}

export function* runSupervisor(specs: ChildSpecification<any[]>[] = [], options: SupervisorOptions = {}): Operation<void> {
  yield createSupervisor(specs, options);
  yield;
}
