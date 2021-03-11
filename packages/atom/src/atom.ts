/* eslint-disable @typescript-eslint/no-explicit-any */
import { Operation } from '@effection/core';
import { createChannel, ChannelOptions } from '@effection/channel';
import { MakeSlice, Container, Slice } from './types';
import { unique } from './unique';

function sliceFromContainer<T>(container: Container<T>): Slice<T> {
  return {
    ...container,
    ...container.stream,
    once(predicate: (state: T) => boolean): Operation<T> {
      return function*() {
        let currentState = container.get();
        if(predicate(currentState)) {
          return currentState;
        } else {
          return yield container.stream.filter(predicate).expect();
        }
      }
    },
    update(fn: (state: T) => T): void {
      container.set(fn(container.get()));
    },
    slice: ((...path: (string | number)[]) => {
      return sliceFromContainer(path.reduce((container, property) => {
        if(typeof(property) === 'number') {
          return makeArrayContainer(container, property);
        } else {
          return makeRecordContainer(container, property);
        }
      }, container as Container<any>));
    }) as MakeSlice<T>
  }
};

function makeRecordContainer(parent: Container<any>, property: string): Container<any> {
  let get = (parentValue: any) => parentValue && parentValue[property];

  return {
    get() {
      return get(parent.get());
    },
    set(value): void {
      if(!parent.get()) {
        parent.set({});
      }
      parent.set({ ...parent.get(), [property]: value });
    },
    remove(): void {
      parent.set({ ...parent.get(), [property]: undefined });
    },
    stream: parent.stream.map(get).filter(unique(get(parent.get()))),
  }
}

function makeArrayContainer(parent: Container<any>, property: number): Container<any> {
  let get = (parentValue: any) => parentValue && parentValue[property];

  return {
    get() {
      return get(parent.get())
    },
    set(value): void {
      if(!parent.get()) {
        parent.set([]);
      }
      let copy = parent.get().slice();
      copy[property] = value;
      parent.set(copy);
    },
    remove(): void {
      let copy = parent.get().slice();
      copy.splice(property, 1);
      parent.set(copy);
    },
    stream: parent.stream.map(get).filter(unique(get(parent.get()))),
  }
}

export function createAtom<S>(state: S, options: ChannelOptions = {}): Slice<S> {
  let states = createChannel<S>(options);

  let container: Container<S> = {
    get() {
      return state;
    },
    set(value): void {
      state = value;
      states.send(state);
    },
    remove(): void {
      // no op?!?!
    },
    stream: states.filter(unique(state)),
  }

  return sliceFromContainer(container);
}
