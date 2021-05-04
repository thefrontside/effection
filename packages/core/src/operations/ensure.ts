import { Operation } from '../operation';

export function *ensure<T>(operation?: Operation<T>): Operation<void> {
  try {
    yield
  } finally {
    yield operation;
  }
}
