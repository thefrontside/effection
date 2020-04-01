import { ExecutionContext } from './context';
import { contextOf } from './resource';
import { isGeneratorFunction, isGenerator } from './generator-function';

export class ControlFunction {
  static of(call) {
    return new this(call);
  }

  /**
   * Builtin controls for promises, generators, generator functions
   * and raw functions.
   */
  static for(operation) {
    if (operation == null) {
      return ControlFunction.of(x => x);
    } else if (operation instanceof ControlFunction) {
      return operation;
    } else if (isGeneratorFunction(operation)) {
      return GeneratorFunctionControl(operation);
    } else if (isGenerator(operation)) {
      return GeneratorControl(operation);
    } else if (typeof operation.then === 'function') {
      return PromiseControl(operation);
    } else if (typeof operation === 'function') {
      return ControlFunction.of(operation);
    }
  }

  constructor(call) {
    this.call = call;
  }
}

export function PromiseControl(promise) {
  return ControlFunction.of(function control({ resume, fail, ensure }) {

    let resolve = resume;
    let reject = fail;
    let noop = x => x;

    // return values of succeed and fail are deliberately ignored.
    // see https://github.com/thefrontside/effection.js/pull/44
    promise.then(value => { resolve(value); }, error => { reject(error); });

    // this execution has passed out of scope, so we don't care
    // what happened to the promise, so make the callbacks noops.
    // this effectively "unsubscribes" to the promise.
    ensure(() => resolve = reject = noop);
  });
}

/**
 * Controls the execution of Generator Functions. It just invokes the
 * generator function to get a reference to the generator, and then
 * delegates to the GeneratorControl to do all the work.
 *
 *  spawn(function*() { yield timeout(10); return 5; });
 */
export const GeneratorFunctionControl = sequence => ControlFunction.of((...args) => {
  return GeneratorControl(sequence()).call(...args);
});

class GeneratorExecutionContext extends ExecutionContext {
  constructor(parentControls, generator) {
    super(true);
    this.generator = generator;
    this.parentControls = parentControls;
    this.ensure(() => {
      this.generator.return();
      parentControls.resume(this.result);
    });
  }

  enter() {
    super.enter(undefined);
    this.advance(() => this.generator.next());
  }

  advance(getNext) {
    try {
      let next = getNext();
      if (next.done) {
        this.resume(next.value);
      } else {
        this.fork(next.value);
      }
    } catch (error) {
      this.fail(error);
    }
  }

  trapExit(child) {
    this.unlink(child);

    if(this.isBlocking) {
      if(contextOf(child.result)) {
        this.parentControls.context.link(contextOf(child.result));
      }
      if (child.isErrored) {
        this.advance(() => this.generator.throw(child.result));
      }
      if (child.isCompleted) {
        this.advance(() => this.generator.next(child.result));
      }
      if (child.isHalted) {
        this.advance(() => this.generator.throw(new HaltError(child.result)));
      }
    }
  }
}

/**
 * Control a sequence of operations expressed as a generator.
 * For each step of the generator. Each `yield` expression of
 * the generator should pass an operation which will then be
 * executed in its own context. These child container contexts have
 * their own `fail` and `resume` functions local to the generator
 * that proceed to the next step. Once the generator is finished or
 * throws an exception, control is passed back to the calling parent.
 */
export const GeneratorControl = generator => ControlFunction.of(self => {
  let generatorContext = new GeneratorExecutionContext(self, generator);
  self.context.link(generatorContext);
  generatorContext.enter();
});

export function fork(operation) {
  return ({ resume, fork } ) => {
    resume(fork(operation));
  };
}

export function spawn(operation) {
  return ({ resume, spawn } ) => {
    resume(spawn(operation));
  };
}

export function join(antecedent) {
  return ({ resume, fail, ensure, context }) => {
    let disconnect = antecedent.ensure(function join() {
      if (context.isRunning) {
        let { result } = antecedent;
        if (antecedent.isCompleted) {
          resume(result);
        } else if (antecedent.isErrored) {
          fail(result);
        } else if (antecedent.isHalted) {
          fail(new HaltError(antecedent.result));
        }
      }
    });

    ensure(disconnect);
  };
}

export class HaltError extends Error {
  constructor(cause) {
    super(`Interrupted: ${cause}`);
    this.cause = cause;
  }
}
