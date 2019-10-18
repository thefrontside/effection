import Execution from './execution';

export function execute(operation) {
  let execution = Execution.of(operation);
  execution.start();
  return execution;
}
