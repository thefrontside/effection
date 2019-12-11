/**
* Create an execution controller that resumes after the specified
* duration. E.g.
*
*   function* waitAndSayHello(target) {
*     yield timeout(100);
*     console.log(`Hello ${target}!`);
*   }
*/
export function timeout(duration) {
  return ({ resume, ensure }) => {
    let timeoutId = setTimeout(resume, duration);
    ensure(() => clearTimeout(timeoutId));
  };
}
