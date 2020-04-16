import { Deferred } from 'effection';

let noValue = Deferred<void>();
noValue.resolve();

let yieldsNumber = Deferred<number>();

// you cannot resolve a number future with void
// $ExpectError
yieldsNumber.resolve();

// you cannot resolve a number future with void
// $ExpectError
yieldsNumber.resolve('Hello World');

yieldsNumber.resolve(10);

let { reject } = Deferred<void>();

// you have to reject with an instace of Error
// $ExpectError
reject('Hello');

reject(new Error('boom!'));

let future: Deferred<void> = Deferred();
