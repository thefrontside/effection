const SymbolOperation = Symbol.for("Symbol.operation");

export interface SymbolExtentions {
  operation: typeof SymbolOperation;
}

export type SymbolConstructor = typeof Symbol & SymbolExtentions;

const SymbolExtended: SymbolConstructor = Object.create(Symbol, {
  operation: {
    writable: false,
    enumerable: false,
    configurable: false,
    value: SymbolOperation,
  },
});

export { SymbolExtended as Symbol };
