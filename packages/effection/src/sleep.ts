import { Operation } from './operation';

export function *sleep(duration: number): Operation<void> {
  let timeoutId;
  try {
    yield new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  } finally {
    if(timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
