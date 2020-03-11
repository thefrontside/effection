import { Operation, Controller } from 'effection';

function *randomNumber(): Operation<number> {
  yield;
  return 4;
}

function *main(): Operation<string> {
  let result = yield randomNumber();

  result += 1;

  return `thing${result}`;
}

let controlFunction: Controller<number> = ({ resume }) => {
  resume(123);
}

function *brokenGenerator(): Operation<number> {
  yield;
  // cannot return invalid type
  // $ExpectError
  return "number";
}

let brokenControlFunction: Controller<number> = ({ resume }) => {
  // cannot resume with another type
  // $ExpectError
  resume("somestring");
}
