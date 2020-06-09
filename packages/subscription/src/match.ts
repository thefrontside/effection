export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
};

export function matcher<T>(reference: unknown): (value: T) => boolean {
  return (value: unknown) => {
    if(typeof(value) === 'object' && typeof(reference) === 'object') {
      let castedValue = value as Record<string, any>;
      let castedReference = reference as Record<string, any>;
      return Object.entries(castedReference).every(([key, ref]) => matcher(ref)(castedValue[key]));
    } else {
      return value === reference;
    }
  };
}
