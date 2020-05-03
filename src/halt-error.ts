export class HaltError extends Error {
  __isEffectionHaltError: true;

  constructor() {
    super("halted");
  }
}
