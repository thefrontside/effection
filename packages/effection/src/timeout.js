import { Deferred } from './deferred';
/**
* Create an execution controller that resumes after the specified
* duration. E.g.
*
*   function* waitAndSayHello(target) {
*     yield timeout(100);
*     console.log(`Hello ${target}!`);
*   }
*/
export function* timeout(duration) {
  let { resolve, promise } = Deferred();
  let timeoutId = setTimeout(resolve, duration);
  try {
    yield promise;
  } finally {
    clearTimeout(timeoutId);
  }
}
