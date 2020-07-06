/**
 * Hack Zone!
 *
 * tl;dr not only the symbol value, but also the symbol type must be
 * global.
 *
 * In order to satisfy TypeScript that the SymbolSubscribable
 * represents the same value across different versions of the same
 * package, we need to declare a "fake" global variable that does not
 * actually exist, but has a theoretical type. Since it is global,
 * TypeScript will see it as the same type everywhere, and so we can
 * use the `typeof` for the value, as the type of of our local symbol
 * subscribable, and TypeScript will think that all of the types are
 * the same.
 *
 * See https://github.com/microsoft/TypeScript/issues/8099#issuecomment-210134773
 * for details.
 */

/* eslint-disable */
declare global {
  const __global_variable_to_hold_type_of_global_subscribable_symbol: unique symbol;
}

export const SymbolSubscribable: typeof __global_variable_to_hold_type_of_global_subscribable_symbol = Symbol.for('Symbol.subscription') as any;
