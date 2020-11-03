import { renderHook, act, cleanup } from '@testing-library/react-hooks'
import { useEffection } from '../src'

afterEach(cleanup);

test("it can perform some asynchronous work", async () => {

  const { result, waitForNextUpdate } = renderHook(() => useEffection(function * () {
    return yield Promise.resolve('hello');
  }));

  result.current[0]();

  await waitForNextUpdate()

  expect(result.current[1].isRunning).toBe(false);
});

