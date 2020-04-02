import { ExecutionContext } from './context';

let symbol = Symbol("resource");

export function contextOf(resource) {
  if(resource instanceof ExecutionContext) {
    return resource;
  } else if(typeof(resource) === "object" || typeof(resource) === "function") {
    return resource[symbol];
  }
}

export function resource(object, operation) {
  return ({ resume, context } ) => {
    let child = new ExecutionContext({ isRequired: false, allowContextReturn: false });
    context.link(child);
    child.enter(operation);
    Object.defineProperty(object, symbol, {
      value: child,
      configurable: true,
      enumerable: false,
      writable: false,
    });
    resume(object);
  };
}
