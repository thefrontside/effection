import * as O from 'fp-ts/Option';
import * as Op from 'monocle-ts/Optional';
import { pipe } from 'fp-ts/function';
import { ChannelOptions, createChannel, createStream } from 'effection';
import { NestedIndex, ResolveKeys, Slice } from './types';
import { unique } from './unique';

/**
 * Create a new atom for managing state. An atom has a current value which
 * can be retrieved and updated, and which can be consumed as a stream.
 *
 * An atom can also be sliced to work with nested state.
 *
 * ### Example
 *
 * ```typescript
 * import { main, spawn } from 'effection';
 * import { createAtom } from '@effection/atom';
 *
 * main(function*() {
 *   let atom = createAtom({ room: { lights: 4 } });
 *   let lights = atom.slice('room', 'lights');
 *
 *   yield spawn(lights.forEach((number) => console.log(`there are ${number} lights`)));
 *
 *   lights.update((number) => number + 1);
 *   lights.set(8);
 *
 *   console.log(atom.get()) // => { room: { lights: 8 } }
 * });
 * ```
 *
 * See [the atom guide](https://frontside.com/effection/docs/guides/atom) for more details.
 *
 * @param initialState the state that the atom starts out with
 * @param options options to pass down to the underlying channel, see `createChannel`
 */
export function createAtom<S>(initialState: S, options: ChannelOptions = {}): Slice<S> {
  let lens = pipe(Op.id<O.Option<S>>(), Op.some);
  let state: O.Option<S> = O.fromNullable(initialState);
  let states = createChannel(options);
  let valueQueue: S[] = [];
  let didEnter = false;

  function getState(): O.Option<S> {
    return state;
  }

  function setState(value: S) {
    let next = O.fromNullable(value);

    if (next === getState()) {
      return;
    }

    // there is a compromise here in when we set this value, either the
    // listener itself, or downstream listeners might see an incorrect value
    // after setting. If we don't set the value immediately then we risk that a
    // downstream update will set the state to an old version of itself.
    state = next;

    valueQueue.push(O.toUndefined(next) as S);

    if(!didEnter) {
      try {
        didEnter = true;

        let nextValue;
        while(nextValue = valueQueue.shift()) {
          states.send(nextValue);
        }
      } finally {
        didEnter = false;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sliceMaker = <A>(parentPath?: string[], parentOptional: Op.Optional<O.Option<S>, A> = lens as unknown as Op.Optional<O.Option<S>, A>): Slice<A>['slice'] =>
    <P extends [keyof A, ...NestedIndex<A, P>]>(...path: P): Slice<ResolveKeys<A, P>> => {
      // The [any, any] cast is needed as `pipe` expects more than 2 arguments
      // typescript cannot work out if the `getters` array has 0 or more elements
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let getters = (path ?? []).map(p => (typeof p === 'number') ? Op.index(p) : Op.prop<A, P[0]>(p as any)) as [any, any];

      let fullPath = [...(parentPath ?? []), ...path] as string[];

      let sliceOptional = pipe(
         parentOptional,
         Op.fromNullable,
         ...getters
      ) as Op.Optional<O.Option<S>, ResolveKeys<A,P>>;


      let streamName = fullPath.length ? `slice(${fullPath.map((s) => `'${s}'`).join(', ')})` : 'atom';

      let stream = createStream<ResolveKeys<A,P>>(publish => {
        publish(get());
        return states.map(
          (s) => pipe(s as S, O.fromNullable, sliceOptional.getOption, O.toUndefined) as ResolveKeys<A,P>
        ).filter(unique(get())).forEach(publish);
      }, streamName);

      function getOption(): O.Option<ResolveKeys<A,P>> {
        let current = pipe(
          getState(),
          sliceOptional.getOption,
        );

        return current;
      }

      function get(): ResolveKeys<A, P> {
        return pipe(
          getOption(),
          O.toUndefined
        ) as ResolveKeys<A, P>;
      }

      function set(value: ResolveKeys<A,P>): void {
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

      function update(fn: (s: ResolveKeys<A,P>) => ResolveKeys<A,P>) {
        let next = pipe(
          sliceOptional,
          Op.modify(fn),
        )(getState());

        setState(O.toUndefined(next) as S);
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
        slice: sliceMaker(fullPath, sliceOptional),
        remove,
      }, stream);
  };

  return sliceMaker<S>().apply([]) as unknown as Slice<S>;
}
