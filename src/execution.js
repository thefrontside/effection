import isGeneratorFunction from './is-generator';
import Task, { isTask } from './task';
import Continuation from './continuation';

export default class Execution {
  static of(task) {
    return new Execution(task, x => x);
  }

  get isUnstarted() { return this.status instanceof Unstarted; }
  get isRunning() { return this.status instanceof Running; }
  get isBlocking() { return this.isRunning || this.isWaiting; }
  get isCompleted() { return this.status instanceof Completed; }
  get isErrored() { return this.status instanceof Errored; }
  get isHalted() { return this.status instanceof Halted; }
  get isWaiting() { return this.status instanceof Waiting; }

  get hasBlockingChildren() { return this.children.some(child => child.isBlocking); }

  get result() { return this.status.result; }

  constructor(task) {
    this.task = Task(task);
    this.status = new Unstarted(this);
    this.children = [];
    this.continuation = ExecutionFinalized;
  }

  start(args) {
    this.status.start(args);
  }

  resume(value) {
    this.status.resume(value);
  }

  throw(error) {
    this.status.throw(error);
  }

  halt(message) {
    this.status.halt(message);
  }

  fork(task, ...args) {
    this.status.fork(task, args);
  }

  then(...args) {
    this.continuation = this.continuation.then(...args);
    return this;
  }

  catch(...args) {
    this.continuation = this.continuation.catch(...args);
    return this;
  }

  finally(...args) {
    this.continuation = this.continuation.finally(...args);
    return this;
  }
}

class Status {
  constructor(execution) {
    this.execution = execution;
  }

  start() {
    this.cannot('start');
  }

  resume() {
    this.cannot('resume');
  }

  throw() {
    this.cannot('throw');
  }

  halt() {
    this.cannot('halt');
  }

  fork() {
    this.cannot('fork');
  }

  cannot(operationName) {
    let name = this.constructor.name;
    let message = `tried to perfom operation ${operationName}() on an execution with status '${name}'`;
    throw new Error(`InvalidOperationError: ${message}`);
  }

  finalize(status) {
    let { execution } = this;
    execution.status = status;
    execution.continuation.call(execution);
  }

}

const Finalized = Status => class FinalizedStatus extends Status {
  halt() {}
};

class Unstarted extends Status {
  start(args) {
    let { generator } = this.execution.task;
    let { execution } = this;

    let iterator = generator.apply(execution, args);

    execution.status = new Running(execution, iterator);
    execution.resume();
  }
}

class Running extends Status {
  constructor(execution, iterator, current = { done: false }) {
    super(execution);
    this.iterator = iterator;
    this.current = current;
    this.noop = x => x;
    this.releaseControl = this.noop;
  }

  thunk(thunk) {
    let { execution, iterator } = this;
    try {
      this.releaseControl();
      let next = thunk(iterator);
      if (next.done) {
        if (execution.hasBlockingChildren) {
          execution.status = new Waiting(execution, next.value);
        } else {
          this.finalize(new Completed(execution, next.value));
        }
      } else {
        let control = controllerFor(next.value);
        let release = control(execution);
        if (typeof release === 'function') {
          this.releaseControl = release;
        } else {
          this.releaseControl = this.noop;
        }
      }
    } catch (e) {
      // error was thrown, but not caught in the generator.
      this.status = new Errored(execution, e);
      execution.children.forEach(child => child.halt(e));
      this.finalize(new Errored(execution, e));
    }
  }

  resume(value) {
    this.thunk(iterator => iterator.next(value));

  }

  throw(error) {
    this.thunk(iterator => iterator.throw(error));
  }

  halt(value) {
    let { execution, iterator } = this;
    this.releaseControl();
    iterator.return(value);
    execution.status = new Halted(execution, value);
    execution.children.forEach(child => {
      child.halt(value);
    });
    this.finalize(new Halted(execution, value));
  }

  fork(task, args) {
    let parent = this.execution;

    let child = new Execution(task).then(() => {
      if (parent.isWaiting && !parent.hasBlockingChildren) {
        this.finalize(new Completed(parent, parent.result));
      }
    }).catch(e => parent.throw(e));

    parent.children.push(child);
    child.start(args);
    return child;
  }
}

class Completed extends Finalized(Status) {
  constructor(execution, result) {
    super(execution);
    this.result = result;
  }
}

class Errored extends Finalized(Status) {
  constructor(execution, error) {
    super(execution);
    this.result = error;
  }
}

class Halted extends Finalized(Status) {
  constructor(execution, message) {
    super(execution);
    this.result = message;
  }
}

class Waiting extends Completed {

  halt(value) {
    let { execution } = this;
    execution.status = new Halted(execution, value);
    execution.children.forEach(child => {
      child.halt(value);
    });
    this.finalize(new Halted(execution, value));
  }

  throw(error) {
    let { execution } = this;
    execution.status = new Errored(execution, error);
    execution.children.forEach(child => {
      child.halt(error);
    });
    this.finalize(new Errored(execution, error));
  }
}

function controllerFor(value) {
  if (isGeneratorFunction(value) || isTask(value)) {
    return call(value);
  } else if (typeof value === 'function') {
    return value;
  } else {
    throw new Error('generators should yield either another generator or control function, not `${value}`');
  }
}

export function call(task, ...args) {
  return parent => {
    let child = new Execution(task).then(child => {
      if (child.isCompleted) {
        return parent.resume(child.result);
      }

      // call() is synchronous so the parent is waiting for the
      // return value of the child. If the child is halted, and the
      // parent is still running, that means its waiting on the child
      // and so it's an error because the child was interupted
      if (child.isHalted && parent.isRunning) {
        return parent.throw(new Error(`Interupted: ${child.result}`));
      }
    }).catch(e => parent.throw(e));

    parent.children.push(child);
    child.start(args);
  };
}


const ExecutionFinalized = Continuation.of(execution => {
  if (execution.isErrored) {
    let error = execution.result;
    error.execution = execution;
    throw error;
  } else {
    return execution;
  }
});
