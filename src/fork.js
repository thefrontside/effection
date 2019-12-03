import { noop } from './noop';
import { promiseOf } from './promise-of';
import { isGenerator, isGeneratorFunction, toGeneratorFunction } from './generator-function';

class Fork {
  static ids = 0;
  get isUnstarted() { return this.state === 'unstarted'; }
  get isRunning() { return this.state === 'running'; }
  get isWaiting() { return this.state === 'waiting'; }
  get isCompleted() { return this.state === 'completed'; }
  get isErrored() { return this.state === 'errored'; }
  get isHalted() { return this.state === 'halted'; }

  get isBlocking() { return this.isRunning || this.isWaiting || this.isUnstarted; }

  get hasBlockingChildren() {
    for (let child of this.children) {
      if (child.isBlocking) {
        return true;
      }
    }
    return false;
  }

  constructor(operation, parent, sync) {
    this.id = Fork.ids++;
    this.operation = toGeneratorFunction(operation);
    this.parent = parent;
    this.sync = sync;
    this.children = new Set();
    this.state = 'unstarted';
    this.exitPrevious = noop;
  }

  get promise() {
    this._promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    this.finalizePromise();
    return this._promise;
  }

  then(...args) {
    return this.promise.then(...args);
  }

  catch(...args) {
    return this.promise.catch(...args);
  }

  finally(...args) {
    return this.promise.finally(...args);
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
    let child = new Fork(operation, this, sync);
    this.children.add(child);
    setTimeout(() => {
      child.resume();
    }, 0);
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
    if (child.isBlocking) {
      throw new Error(`
Tried to call Fork#join() with a child that has not been
finalized. This should never happen and so probably indicates a bug
in effection. All of its users would be in your eternal debt were you
to please take the time to report this issue here:
https://github.com/thefrontside/effection.js/issues/new
`);
    }
    this.children.delete(child);

    if (child.isCompleted) {
      if (this.isWaiting && !this.hasBlockingChildren) {
        this.finalize('completed');
      } else if (this.isRunning && child.sync) {
        this.resume(child.result);
      }
    } else if (child.isHalted) {
      if (this.isWaiting && !this.hasBlockingChildren) {
        this.finalize('completed');
      } else if (this.isRunning && child.sync) {
        this.throw(new Error(`Interupted: ${child.result}`));
      }
    } else if (child.isErrored) {
      this.throw(child.result);
    }
  }

  thunk(fn) {
    let next;
    let previouslyExecuting = Fork.currentlyExecuting;
    try {
      Fork.currentlyExecuting = this;

      this.exitPrevious();

      try {
        next = fn(this.iterator);
      } catch(error) {
        this.finalize('errored', error);
        return;
      }

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
    }
    this.finalizePromise();
  }

  finalizePromise() {
    if(this.isCompleted && this.resolve) {
      this.resolve(this.result);
    } else if(this.isErrored && this.reject) {
      this.reject(this.result);
    } else if(this.isHalted && this.reject) {
      this.reject(new HaltError(this.result));
    }
  }

  get root() {
    if(this.parent) {
      return this.parent.root;
    } else {
      return this;
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

class HaltError extends Error {
  constructor(cause) {
    super("halt");
    this.cause = cause;
  }
}

function controllerFor(value) {
  if (isGeneratorFunction(value) || isGenerator(value)) {
    return parent => parent.fork(value, true);
  } else if (typeof value === 'function') {
    return value;
  } else if (value == null) {
    return x => x;
  } else if (typeof value.then === 'function') {
    return promiseOf(value);
  } else {
    throw new Error(`generators should yield either another generator or control function, not '${value}'`);
  }
}
