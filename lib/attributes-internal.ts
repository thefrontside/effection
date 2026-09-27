import { createContext } from "./context.ts";
import { useScope } from "./scope.ts";
import type { Operation, Scope } from "./types.ts";

/**
 * Serializable name/value pairs that can be used for visualizing and
 * inpsecting Effection scopes. There will always be at least a name
 * in the attributes.
 */
export type Attributes =
  & { name: string }
  & Record<string, string | number | boolean>;

const AttributesContext = createContext<Attributes>(
  "@effection/attributes",
  { name: "anonymous" },
);

/**
 * Add metadata to the current {@link Scope} that can be used for
 * display and debugging purposes.
 *
 * Calling `useAttributes()` multiple times will add new attributes
 * and overwrite attributes of the same name, but it will not erase
 * old ones.
 *
 * @example
 * ```ts
 * function useServer(port: number): Operation<Server> {
 *   return resource(function*(provide) {
 *     yield* useAttributes({ name: "Server", port });
 *     let server = createServer();
 *     server.listen();
 *     try {
 *       yield* provide(server);
 *     } finally {
 *       server.close();
 *     }
 *   });
 * }
 * ```
 *
 * @param attrs - attributes to add to this {@link Scope}
 * @returns an Oeration adding `attrs` to the current scope
 * @since 4.1
 */
export function* useAttributes(attrs: Partial<Attributes>): Operation<void> {
  let scope = yield* useScope();

  let current = scope.hasOwn(AttributesContext)
    ? scope.expect(AttributesContext)
    : AttributesContext.defaultValue!;

  scope.set(AttributesContext, { ...current, ...attrs });
}

/**
 * Get the unique attributes of this {@link Scope}. Attributes are not
 * inherited and only the attributes explicitly assigned to this scope
 * will be returned.
 */
export function getAttributes(scope: Scope) {
  if (scope.hasOwn(AttributesContext)) {
    return scope.expect(AttributesContext);
  }
  return AttributesContext.defaultValue as Attributes;
}
