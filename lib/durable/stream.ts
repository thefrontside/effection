import type { DurableEvent, DurableStream, StreamEntry } from "./types.ts";

/**
 * In-memory implementation of a DurableStream.
 *
 * This is the simplest possible implementation: an append-only array
 * of events with sequential integer offsets starting at 0.
 *
 * In a real system, this would be backed by the Durable Streams
 * protocol (HTTP, persistent storage, idempotent producers, etc.).
 * For now, this lets us build and test the durable runner without
 * any external dependencies.
 */
export class InMemoryDurableStream implements DurableStream {
  private entries: StreamEntry[] = [];
  private _closed = false;

  get length(): number {
    return this.entries.length;
  }

  get closed(): boolean {
    return this._closed;
  }

  append(event: DurableEvent): number {
    if (this._closed) {
      throw new Error("Cannot append to a closed stream");
    }
    let offset = this.entries.length;
    this.entries.push({ offset, event });
    return offset;
  }

  read(fromOffset = 0): StreamEntry[] {
    return this.entries.slice(fromOffset);
  }

  close(): void {
    this._closed = true;
  }

  /**
   * Create a stream pre-populated with events.
   * Useful for testing replay scenarios.
   *
   * @param events - events to populate the stream with
   * @param closed - whether the stream should be closed (default: false)
   */
  static from(events: DurableEvent[], closed = false): InMemoryDurableStream {
    let stream = new InMemoryDurableStream();
    for (let event of events) {
      stream.entries.push({ offset: stream.entries.length, event });
    }
    stream._closed = closed;
    return stream;
  }
}
