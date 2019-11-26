export function any(type) {
  if(type === "array") {
    return function anyMatcher(value) {
      return Array.isArray(value);
    };
  } else if(type) {
    return function anyMatcher(value) {
      return typeof(value) === type;
    };
  } else {
    return function anyMatcher() {
      return true;
    };
  }
}

export function patternMatch(match) {
  return function matcher(target) {
    if(match === undefined) {
      return true;
    } else if(Array.isArray(match)) {
      return match.every((value, index) => patternMatch(value)(target[index]));
    } else if(typeof(match) === "object") {
      return Object.entries(match).every(([key, value]) => patternMatch(value)(target[key]));
    } else if(typeof(match) === "function") {
      return match(target);
    } else {
      return match === target;
    }
  };
}
