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

  self.ensure(() => generator.return());

  let resume = value => advance(() => generator.next(value));

  let fail = error => advance(() => generator.throw(error));

  function advance(getNext) {
    try {
      let next = getNext();
      if (next.done) {
        self.resume(next.value);
      } else {
        let operation = next.value;
        let child = self.spawn(operation);

        child.ensure(function done() {
          if (self.context.isBlocking) {
            if (child.isErrored) {
              fail(child.result);
            }
            if (child.isCompleted) {
              resume(child.result);
            }
            if (child.isHalted) {
              fail(new HaltError(child.result));
            }
          }
        });
      }
    } catch (error) {
      self.fail(error);
    }
  }

  resume();
});

export function fork(operation) {
  return ({ resume, context } ) => {
    let parent = context.parent ? context.parent : context;
    let child = parent.spawn(operation);

    child.ensure(() => {
      if (child.isErrored) {
        parent.fail(child.result);
      }
    });

    resume(child);
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
