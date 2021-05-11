import { Operation } from '../operation';

export function sleep(duration?: number): Operation<void> {
  if(duration) {
    return {
      perform(resolve) {
        let timeoutId = setTimeout(resolve, duration);
        return () => clearTimeout(timeoutId);
      }
    }
  }
}
