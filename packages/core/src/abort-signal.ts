import { spawn } from './operations/spawn';
import { Resource } from "./operation";
import { AbortController } from 'abort-controller';

function createAbortSignal(): Resource<any> {
  return {
    *init() {
      let controller = new AbortController();
      yield spawn(function* () {
        try {
          yield;
        } finally {
          controller.abort();
        }
      })
      return controller.signal;
    }
  }
}

export { createAbortSignal };
