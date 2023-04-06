export function lazy<T>(create: () => T): () => T {
  let thunk = () => {
    let value = create();
    thunk = () => value;
    return value;
  };
  return () => thunk();
}
