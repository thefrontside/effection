/**
 * An execution controller that resumes or throws based
 * on a promise.
 */
export function promiseOf(promise) {
  return function control(execution) {

    let succeed = value => execution.resume(value);
    let fail = err => execution.throw(err);
    let noop = x => x;

    promise.then(value => succeed(value)).catch(error => fail(error));

    // this execution has passed out of scope, so we don't care
    // what happened to the promise, so make the callbacks noops.
    return () => succeed = fail = noop;
  };
}
