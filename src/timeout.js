/**
* Create an execution controller that resumes after the specified
* duration. E.g.
*
*   function* waitAndSayHello(target) {
*     yield timeout(100);
*     console.log(`Hello ${target}!`);
*   }
*/
export function timeout(durationMillis = 0) {
  return function(execution) {
    let timeoutId = setTimeout(() => execution.resume(), durationMillis);
    return () => clearTimeout(timeoutId);
  };
}
