import * as O from "fp-ts/Option";
import * as Op from "monocle-ts/lib/Optional"
import { pipe } from 'fp-ts/function'
import { Operation } from '@effection/core';
import { createChannel, ChannelOptions } from '@effection/channel';
import { MakeSlice, Slice } from './types';
import { unique } from './unique';

export function createAtom<S>(initialState: S, options: ChannelOptions = {}): Slice<S> {
  let lens = pipe(Op.id<O.Option<S>>(), Op.some);
  let state: O.Option<S> = O.fromNullable(initialState);
  let states = createChannel(options);

  function getState(): O.Option<S> {
    return state;
  }

  function setState(value: S) {
    let next = O.fromNullable(value);

    if (next === getState()) {
      return;
    }

    state = next;

    states.send(O.toUndefined(state) as S);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sliceMaker = <A>(parentOptional: Op.Optional<O.Option<S>, A> = lens as unknown as Op.Optional<O.Option<S>, A>): MakeSlice<any> =>
    <P extends keyof A>(...path: P[]): Slice<A[P]> => {
      // The [any, any] cast is needed as `pipe` expects more than 2 arguments
      // typescript cannot work out if the `getters` array has 0 or more elements
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let getters = (path || []).map(p => (typeof p === 'number') ? Op.index(p) : Op.prop<A, P>(p)) as [any, any];

      let sliceOptional = pipe(
         parentOptional,
         Op.fromNullable,
         ...getters
      ) as Op.Optional<O.Option<S>, A[P]>;

      let stream = states.map(
        (s) => pipe(s as S, O.fromNullable, sliceOptional.getOption, O.toUndefined) as A[P]
      ).filter(unique(get()));

      function getOption(): O.Option<A[P]> {
        let current = pipe(
          getState(),
          sliceOptional.getOption,
        );

        return current;
      }

      function get(): A[P] {
        return pipe(
          getOption(),
          O.toUndefined
        ) as A[P];
      }

      function set(value: A[P]): void {
        if(value === get()) {
          return;
        }

        let next = pipe(
          getState(),
          sliceOptional.set(value),
          O.toUndefined
        );

        setState(next as S);
      }

      function update(fn: (s: A[P]) => A[P]) {
        let next = pipe(
          sliceOptional,
          Op.modify(fn),
        )(getState());

        setState(O.toUndefined(next) as S);
      }

      function once(predicate: (state: A[P]) => boolean): Operation<A[P]> {
        return function*() {
          let currentState = get();
          if(predicate(currentState)) {
            return currentState;
          } else {
            return yield stream.filter(predicate).expect();
          }
        }
      }

      function remove() {
        let next = pipe(
          sliceOptional,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Op.modify(() => undefined as any),
        )(getState());

        setState(O.toUndefined(next) as S);
      }

      return Object.assign({
        get,
        set,
        update,
        stream,
        once,
        slice: sliceMaker(sliceOptional),
        remove,
      }, stream);
  }

  return {
    ...sliceMaker()(),
  };
}
