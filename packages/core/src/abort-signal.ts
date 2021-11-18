import { spawn } from './operations/spawn';
import { Resource } from "./operation";
import { AbortController, AbortSignal } from 'abort-controller';

function createAbortSignal(): Resource<AbortSignal> {
  return {
    *init() {
      let controller = new AbortController();
      yield spawn(function* () {
        try {
          yield;
        } finally {
          controller.abort();
        }
      });
      return controller.signal;
    }
  };
}

export { createAbortSignal, AbortSignal };
