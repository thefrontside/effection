export function create<T>(
  tag: string,
  attrs: Partial<T>,
  prototype: Partial<T>,
): T {
  let properties: Record<string, PropertyDescriptor> = {};
  for (let [key, value] of Object.entries(attrs)) {
    properties[key] = { enumerable: true, value };
  }
  return Object.create({
    ...prototype,
    [Symbol.toStringTag]: tag,
  }, properties);
}
