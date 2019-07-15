import Execution from './execution';

export function execute(task, ...args) {
  let execution = Execution.of(task);
  execution.start(args);
  return execution;
}
