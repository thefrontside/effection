import { spawn } from './operations/spawn';
import { Resource } from "./operation";
import { AbortController, AbortSignal } from 'abort-controller';

function createAbortSignal(): Resource<AbortSignal> {
  return {
    labels: {
      name: 'createAbortSignal()'
    },
    *init() {
      let controller = new AbortController();
      yield spawn(function* () {
        try {
          yield;
        } finally {
          controller.abort();
        }
      }, {
        labels: {
          name: 'controller.abort()'
        }
      });
      return controller.signal;
    }
  };
}

export { createAbortSignal, AbortSignal };
