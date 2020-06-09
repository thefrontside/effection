export function Deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => { return };
  let reject: (error: Error) => void = () => {return };

  let promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  }) ;

  return {
    resolve,
    reject,
    promise
  }
}

export interface Deferred<T> {
  resolve(value: T): void;
  reject(error: Error): void;
  promise: Promise<T>;
}