import { Context, Operation, main } from 'effection';
import { renderHook, act, cleanup } from '@testing-library/react-hooks'
import { useEffection } from '../src'

afterEach(cleanup);

type World = Context & { spawn<T>(operation: Operation<T>): Promise<T> };

let currentWorld: World;

beforeEach(() => {
  currentWorld = main(undefined) as World;
});

afterEach(() => {
  currentWorld.halt();
});

test("it can perform some synchronous work", async () => {
  const done = jest.fn();

  const { result } = renderHook(() => useEffection(done));

  act(() => {
    const [perform] = result.current;
    console.log(perform())
  });

  //await waitForNextUpdate();

  expect(done).toBeCalled();
});

