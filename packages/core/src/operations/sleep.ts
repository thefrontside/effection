import { Operation } from '../operation';

export function sleep(duration?: number): Operation<void> {
  return {
    labels: { name: 'sleep', duration: (duration != null) ? duration : 'forever' },
    perform(resolve) {
      if(duration != null) {
        let timeoutId = setTimeout(resolve, duration);
        return () => clearTimeout(timeoutId);
      }
    }
  }
}
