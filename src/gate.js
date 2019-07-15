/**
 * Represents a value that may or may not be accessible.
 *
 * Gate is similar to the `Maybe` type from typical functional
 * programming, but the Gate name is more appropriate for the context
 * in which it is being used.
 */
export default class Gate {
  static open(value) {
    return new Open(value);
  }

  static closed() {
    return Closed.instance;
  }

  ifOpen(action) {
    if (this instanceof Open) {
      action(this.value);
    }
    return this;
  }

  ifClosed(action) {
    if (this instanceof Closed) {
      action();
    }
    return this;
  }
}

class Open extends Gate {
  get isOpen() { return true; }
  get isClosed() { return false; }

  constructor(value) {
    super();
    this.value = value;
  }
}

class Closed extends Gate {
  get isOpen() { return false; }
  get isClosed() { return true; }
}

Closed.instance = new Closed();
