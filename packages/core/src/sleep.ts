import { Operation } from './operation';

export function sleep(duration: number): Operation<void> {
  return (task) => (resolve) => {
    let timeoutId = setTimeout(resolve, duration);
    task.ensure(() => clearTimeout(timeoutId));
  }
}
