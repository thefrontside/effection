const GeneratorFunction = (function*() {}).constructor;

export default function isGeneratorFunction(fn) {
  return fn != null && Object.getPrototypeOf(fn) === GeneratorFunction.prototype;
}
