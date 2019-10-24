import { noop } from './noop';
import { promiseOf } from './promise-of';
import { isGenerator, isGeneratorFunction, toGeneratorFunction } from './generator-function';
import Continuation from './continuation';

class Fork {
  get isUnstarted() { return this.state === 'unstarted'; }
  get isRunning() { return this.state === 'running'; }
  get isWaiting() { return this.state === 'waiting'; }
  get isCompleted() { return this.state === 'completed'; }
  get isErrored() { return this.state === 'errored'; }
  get isHalted() { return this.state === 'halted'; }

  get isBlocking() { return this.isRunning || this.isWaiting; }

  get hasBlockingChildren() {
    for (let child of this.children) {
      if (child.isBlocking) {
        return true;
      }
    }
    return false;
  }

  constructor(operation, parent, sync) {
    this.operation = toGeneratorFunction(operation);
    this.parent = parent;
    this.sync = sync;
    this.children = new Set();
    this.state = 'unstarted';
    this.exitPrevious = noop;
    this.continuation = Continuation.of(frame => {
      if (frame.isErrored) {
        let error = frame.result;
        error.frame = frame;
        throw error;
      } else {
        return frame;
      }
    });
  }

  then(fn) {
    this.continuation = this.continuation.then(fn);
    return this;
  }

  catch(fn) {
    this.continuation = this.continuation.catch(fn);
    return this;
  }

  finally(fn) {
    this.continuation = this.continuation.finally(fn);
    return this;
  }

  halt(value) {
    if (this.isRunning) {
      this.exitPrevious();
      this.iterator.return(value);
    }
    if (this.isBlocking) {
      this.finalize('halted', value);
    }
  }

  throw(error) {
    if (this.isRunning) {
      this.thunk(iterator => iterator.throw(error));
    } else if (this.isWaiting) {
      this.finalize('errored', error);
    } else {
      throw new Error(`
Tried to call Fork#throw() on a Fork that has already been finalized. This
should never happen and so is almost assuredly a bug in effection. All of
its users would be in your eternal debt were you to please take the time to
report this issue here:
https://github.com/thefrontside/effection.js/issues/new

Thanks!`);
    }
  }

  resume(value) {
    if (this.isUnstarted) {
      this.iterator = this.operation.call(this);
      this.state = 'running';
      this.resume(value);
    } else if (this.isRunning) {
      this.thunk(iterator => iterator.next(value));
    } else {
      throw new Error(`
Tried to call Fork#resume() on a Fork that has already been finalized. This
should never happen and so is almost assuredly a bug in effection. All of
its users would be in your eternal debt were you to please take the time to
report this issue here:
https://github.com/thefrontside/effection.js/issues/new

Thanks!`);
    }
    return this;
  }

  fork(operation, sync = false) {
    // console.log(`parent.fork(${operation}, ${sync})`);
    let child = new Fork(operation, this, sync);
    this.children.add(child);
    child.resume();
    return child;
  }

  join(child) {
    if (!this.children.has(child)) {
      return;
    }
    if (!this.isBlocking) {
      throw new Error(`
Tried to call Fork#join() on a Fork that has already been finalized which means
that a sub-fork is being finalized _after_ its parent. This should never happen
and so is almost assuredly a bug in effection. All of its users would be
in your eternal debt were you to please take the time to report this issue here:
https://github.com/thefrontside/effection.js/issues/new

Thanks!
`);
    }
    if (child.isCompleted) {
      if (this.isWaiting && !this.hasBlockingChildren) {
        this.finalize('completed');
      } else if (this.isRunning) {
        this.children.delete(child);
        if (child.sync) {
          this.resume(child.result);
        }
      }
    } else if (child.isErrored) {
      this.throw(child.result);
    } else if (child.isHalted) {
      if (child.sync) {
        this.throw(new Error(`Interupted: ${child.result}`));
      } else {
        if (!this.hasBlockingChildren) {
          this.finalize('completed');
        }
      }
    }
  }

  thunk(fn) {
    try {
      let next = this.enter(fn);
      if (next.done) {
        if (this.hasBlockingChildren) {
          this.state = 'waiting';
        } else {
          this.finalize('completed', next.value);
        }
      } else {
        let controller = controllerFor(next.value);
        /// what happens here if control is synchronous. and resumes execution immediately?
        let exit = controller(this);
        this.exitPrevious = typeof exit === 'function' ? exit : noop;
      }
    } catch (error) {
      this.finalize('errored', error);
    }
  }

  enter(fn) {
    let previouslyExecuting = Fork.currentlyExecuting;
    try {
      Fork.currentlyExecuting = this;
      this.exitPrevious();
      return fn(this.iterator);
    } finally {
      Fork.currentlyExecuting = previouslyExecuting;
    }
  }

  finalize(state, result) {
    this.state = state;
    this.result = result;

    this.children.forEach(child => {
      this.children.delete(child);
      child.halt(result);
    });
    if (this.parent) {
      this.parent.join(this);
    } else {
      this.continuation.call(this);
    }
  }
}

export function fork(operation, parent = Fork.currentlyExecuting) {
  if (parent) {
    return parent.fork(operation);
  } else {
    return new Fork(operation).resume();
  }
}

function controllerFor(value) {
  if (isGeneratorFunction(value) || isGenerator(value)) {
    return parent => parent.fork(value, true);
  } else if (typeof value === 'function') {
    return value;
  } else if (value == null) {
    return x => x;
  } else if (typeof value.then === 'function' && typeof value.catch === 'function') {
    return promiseOf(value);
  } else {
    throw new Error(`generators should yield either another generator or control function, not '${value}'`);
  }
}
