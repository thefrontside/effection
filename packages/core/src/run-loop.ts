export type Runnable = () => void;

export interface RunLoop {
  run(fn: Runnable): void;
}

// A run loop protects against reentrant code, where synchronous callbacks end
// up calling into themselves. This causes problems because it becomes very
// difficult to reason about the underlying state. This could be seen as a sort
// of synchronous mutex
export function createRunLoop(name?: string): RunLoop {
  let didEnter = false;
  let runnables: Runnable[] = [];

  function run(fn: Runnable) {
    runnables.push(fn);
    if(!didEnter) {
      didEnter = true;
      try {
        while(true) {
          let runnable = runnables.shift();
          if(runnable) {
            try {
              runnable();
            } catch(e) {
              console.error(`Caught error in run loop \`${name}\`:`);
              console.error(e);
            }
          } else {
            break;
          }
        }
      } finally {
        didEnter = false;
      }
    }
  }

  return { run };
}
