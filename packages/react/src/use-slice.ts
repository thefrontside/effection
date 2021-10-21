import { useState } from 'react';
import { Stream } from 'effection';
import { useOperation } from './use-operation';

// we add our own simplified version of this so we don't have to depend on @effection/atom
interface Slice<T> extends Stream<T> {
  get(): T;
}

export function useSlice<T>(slice: Slice<T>): T {
  let [state, setState] = useState<T>(slice.get());
  useOperation(slice.forEach(function*(value) { setState(value) }), [slice]);
  return state;
}
