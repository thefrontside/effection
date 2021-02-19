import { EventEmitter } from 'events';

export type State = 'pending' | 'running' | 'halting' | 'halted' | 'erroring' | 'errored' | 'completing' | 'completed';

function f(value: string) { return JSON.stringify(value) };

export class StateMachine {
  current: State = 'pending';

  get isFinishing(): boolean {
    return ['completing', 'halting', 'erroring'].includes(this.current);
  }

  constructor(private emitter: EventEmitter) {}

  private transition(event: string, validTransitions: Partial<Record<State, State>>) {
    let from = this.current;
    let to = validTransitions[from];

    if(!to) {
      let options = Object.keys(validTransitions).map(f).join(', ');
      throw new Error(`INTERNAL ERROR: state transition ${f(event)} is not valid in current state ${f(from)}, should be one of ${options}`)
    }

    this.current = to;
    this.emitter.emit('state', { from, to });
  }

  start() {
    this.transition('start', {
      'pending': 'running',
    });
  }

  resolve() {
    this.transition('resolve', {
      'running': 'completing',
      'completing': 'completing',
      'erroring': 'erroring',
      'halting': 'halting',
    });
  }

  reject() {
    this.transition('reject', {
      'running': 'erroring',
      'completing': 'erroring',
      'halting': 'erroring',
      'erroring': 'erroring',
    });
  }

  halt() {
    this.transition('halt', {
      'running': 'halting',
      'completing': 'halting',
      'halting': 'halting',
      'erroring': 'erroring',
      'halted': 'halted',
      'completed': 'completed',
      'errored': 'errored',
    });
  }

  finish() {
    this.transition('finish', {
      'completing': 'completed',
      'erroring': 'errored',
      'halting': 'halted',
    });
  }
}
