import { EventEmitter } from 'events';

export type State = 'pending' | 'running' | 'halting' | 'halted' | 'erroring' | 'errored' | 'completing' | 'completed';

function f(value: string) { return JSON.stringify(value) }

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

  start() {
    this.transition('start', {
      'pending': 'running',
    });
  }

  completing() {
    this.transition('completing', {
      'running': 'completing',
    });
  }

  erroring() {
    this.transition('erroring', {
      'running': 'erroring',
      'completing': 'erroring',
      'halting': 'erroring',
      'erroring': 'erroring',
    });
  }

  halting() {
    this.transition('halting', {
      'running': 'halting',
      'completing': 'halting',
      'halting': 'halting',
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
