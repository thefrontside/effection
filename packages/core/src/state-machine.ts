import { EventEmitter } from 'events';

/**
 * The state of a Task can be one of the following:
 *
 * - `pending`: the task has not been started yet
 * - `running`: the task is currently running
 * - `halting`: the task has been halted, but halting is not finished yet
 * - `halted`: the task is fully halted
 * - `erroring`: the task or one of its children has failed and is in the process of shutting down
 * - `errored`: the task has fully failed and evaluates to an Error
 * - `completing`: the task is completing and shutting down its children
 * - `completed`: the task is fully complete and evaluates to a value
 */
export type State = 'pending' | 'running' | 'halting' | 'halted' | 'erroring' | 'errored' | 'completing' | 'completed';

function f(value: string) { return JSON.stringify(value) }

/**
 * @hidden
 */
export type StateTransition = {
  from: State;
  to: State;
};

export class StateMachine {
  current: State = 'pending';

  constructor(private emitter: EventEmitter) {}

  private transition(event: string, validTransitions: Partial<Record<State, State>>) {
    let from = this.current;
    let to = validTransitions[from];

    if(!to) {
      let options = Object.keys(validTransitions).map(f).join(', ');
      throw new Error(`INTERNAL ERROR: state transition ${f(event)} is not valid in current state ${f(from)}, should be one of ${options}`);
    }

    this.current = to;
    this.emitter.emit('state', { from, to });
  }

  get isFinalized(): boolean {
    return this.current === 'errored' || this.current === 'completed' || this.current === 'halted';
  }

  start(): void {
    this.transition('start', {
      'pending': 'running',
    });
  }

  completing(): void {
    this.transition('completing', {
      'running': 'completing',
    });
  }

  erroring(): void {
    this.transition('erroring', {
      'running': 'erroring',
      'completing': 'erroring',
      'halting': 'erroring',
      'erroring': 'erroring',
    });
  }

  halting(): void {
    this.transition('halting', {
      'running': 'halting',
      'completing': 'halting',
      'halting': 'halting',
    });
  }

  finish(): void {
    this.transition('finish', {
      'completing': 'completed',
      'erroring': 'errored',
      'halting': 'halted',
    });
  }
}
