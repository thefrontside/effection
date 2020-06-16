import { ExecutionContext } from './context';

const symbol = Symbol.for("@effection.resource");

export function contextOf(resource) {
  if(resource instanceof ExecutionContext) {
    return resource;
  } else if(resource != null) {
    return resource[symbol];
  }
}

export function resource(object, operation) {
  return ({ resume, context } ) => {
    let child = new ExecutionContext({ isRequired: false, blockOnReturnedContext: true });
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
