import isGeneratorFunction from './is-generator';

class Task {
  static of(generator) {
    return new Task(generator);
  }

  static const(value) {
    return Task.of(function*() { //eslint-disable-line require-yield
      return value;
    });
  }

  static func(fn) {
    return Task.of(function*(...args) { //eslint-disable-line require-yield
      return fn.call(this, ...args);
    });
  }

  constructor(generator) {
    this.generator = generator;
  }
}


export default function task(definition) {
  if (isGeneratorFunction(definition)) {
    return Task.of(definition);
  } else if (typeof definition === 'function') {
    return Task.func(definition);
  } else if (definition instanceof Task) {
    return definition;
  } else {
    return Task.const(definition);
  }
}

export function isTask(value) {
  return value instanceof Task;
}
