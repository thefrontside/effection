const GeneratorFunction = (function*() {}).constructor;

export function isGeneratorFunction(fn) {
  return fn != null && Object.getPrototypeOf(fn) === GeneratorFunction.prototype;
}

function fromConstant(value) {
  return fromFunction(() => value);
}

function fromFunction(fn) {
  return function*(...args) { //eslint-disable-line require-yield
    return fn.call(this, ...args);
  };
}

export function toGeneratorFunction(value) {
  if (isGeneratorFunction(value)) {
    return value;
  } else if (typeof value === 'function') {
    return fromFunction(value);
  } else {
    return fromConstant(value);
  }
}
