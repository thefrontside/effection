/**
* Function composition that implements the `Promise` API;
*
*  // f(g(x))
*  Contiunation.of(g).then(f);
*/
export default class Continuation {

  static of(fn) {
    return new Continuation(fn);
  }

  static resolve(value) {
    return Continuation.of(() => value);
  }

  static reject(error) {
    return Continuation.of(() => { throw error; });
  }

  static empty() {
    return Continuation.of(x => x);
  }

  constructor(call) {
    this.call = call;
  }

  then(fn) {
    return flatMap(this, call => Continuation.of(x => {
      let next = fn(call(x));
      if (next instanceof Continuation) {
        return next.call(x);
      } else {
        return next;
      }
    }));
  }

  catch(fn) {
    return flatMap(this, call => Continuation.of(x => {
      try {
        return call(x);
      } catch(e) {
        return fn(e);
      }
    }));
  }

  finally(fn) {
    return flatMap(this, call => Continuation.of(x => {
      try {
        return call(x);
      } finally {
        fn(x);
      }
    }));
  }
}

function flatMap(continuation, sequence) {
  let next = sequence(continuation.call);
  if (!(next instanceof Continuation)) {
    throw new Error(`chaining function must return a Continuation, not '${next}`);
  }
  return next;
}
