/**
 * An execution controller that resumes or throws based
 * on a promise.
 */
export function promiseOf(promise) {
  return function control(execution) {

    let succeed = value => execution.resume(value);
    let fail = err => execution.throw(err);
    let noop = x => x;

    // return values of succeed and fail are deliberately ignored.
    // see https://github.com/thefrontside/effection.js/pull/44
    promise.then(value => { succeed(value); }, error => { fail(error); });

    // this execution has passed out of scope, so we don't care
    // what happened to the promise, so make the callbacks noops.
    // this effectively "unsubscribes" to the promise.
    return () => succeed = fail = noop;
  };
}
