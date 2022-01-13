declare global {
  // eslint-disable-next-line prefer-let/prefer-let
  const SymbolOperation: unique symbol;
}

export interface SymbolExtentions {
  operation: typeof SymbolOperation;
}

export type SymbolConstructor = typeof Symbol & SymbolExtentions;

const SymbolExtended: SymbolConstructor = Object.create(Symbol, {
  operation: {
    writable: false,
    enumerable: false,
    configurable: false,
    value: Symbol.for("Symbol.operation"),
  },
});

export { SymbolExtended as Symbol };
