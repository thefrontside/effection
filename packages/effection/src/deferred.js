/**
 * Create an object that holds a promise along with the control
 * functions needed to control it:
 *
 *   let { resolve, reject, promise } = Deferred();
 *
 *   promise.then(num => console.log('your number is ', 10);
 */
export function Deferred() {
  let resolve;
  let reject;

  let promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  }) ;

  return {
    resolve,
    reject,
    promise
  };
}
