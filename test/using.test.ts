import { createScope, run, suspend, using } from "../mod.ts";
import { describe, expect, it } from "./suite.ts";

describe("using", () => {
  it("should dispose sync disposable value without the native 'using' keyword", async () => {
    let value: number | undefined;
    let resource = new Resource();

    await run(function* () {
      let ref = yield* using(resource);
      value = ref.getValue();
    });

    expect(value).toBeDefined();
    expect(value).toBe(100);
    expect(resource.isDisposed).toBeTruthy();
  });

  it("should dispose async disposable value without the native 'using' keyword", async () => {
    let value: number | undefined;
    let resource = new AsyncResource();

    await run(function* () {
      let ref = yield* using(resource);
      value = ref.getValue();
    });

    expect(value).toBeDefined();
    expect(value).toBe(100);
    expect(resource.isDisposed).toBeTruthy();
  });

  it("disposes resources when the operation errors", async () => {
    let resource = new Resource();
    let error = new Error("boom");

    await expect(
      run(function* () {
        yield* using(resource);
        throw error;
      }),
    ).rejects.toBe(error);

    expect(resource.isDisposed).toBeTruthy();
  });

  it("disposes resources when the owning scope is halted", async () => {
    let [scope, destroy] = createScope();
    let resource = new Resource();
    let resolver: (() => void) | undefined;
    let started = new Promise<void>((resolve) => (resolver = resolve));

    let task = scope.run(function* () {
      yield* using(resource);
      resolver?.();
      yield* suspend();
    });

    await started;
    await expect(destroy()).resolves.toBeUndefined();
    await expect(task).rejects.toThrow("halted");
    expect(resource.isDisposed).toBeTruthy();
  });

  it("waits for async disposal before completing", async () => {
    let resource = new DelayedAsyncResource();

    await run(function* () {
      yield* using(resource);
    });

    expect(resource.disposeStarted).toBeTruthy();
    expect(resource.isDisposed).toBeTruthy();
  });

  it("errors on non-disposable runtime values", async () => {
    await expect(
      run(function* () {
        // deno-lint-ignore no-explicit-any
        yield* using({} as any);
      }),
    ).rejects.toThrow();
  });
});

class Resource {
  value = 100;
  isDisposed = false;

  getValue() {
    if (this.isDisposed) {
      throw new Error("Resource is disposed");
    }
    return this.value;
  }

  [Symbol.dispose]() {
    this.isDisposed = true;
  }
}

class AsyncResource {
  value = 100;
  isDisposed = false;

  getValue() {
    if (this.isDisposed) {
      throw new Error("Resource is disposed");
    }
    return this.value;
  }

  async [Symbol.asyncDispose]() {
    await Promise.resolve(void 0);
    this.isDisposed = true;
  }
}

class DelayedAsyncResource {
  isDisposed = false;
  disposeStarted = false;

  async [Symbol.asyncDispose]() {
    this.disposeStarted = true;

    let id: ReturnType<typeof setTimeout> | undefined;

    try {
      await new Promise<void>((resolve) => {
        id = setTimeout(resolve, 20);
      });

      this.isDisposed = true;
    } finally {
      if (id) clearTimeout(id);
    }
  }
}
