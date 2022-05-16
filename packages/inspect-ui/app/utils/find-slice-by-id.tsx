import { InspectStateSlice } from "../app";

export function findSliceById(
  slice: InspectStateSlice,
  targetId: number): InspectStateSlice | undefined {
  let task = slice.get();

  if (task.id === targetId) {
    return slice;
  }

  if (task.yieldingTo) {
    let result = findSliceById(
      slice.slice("yieldingTo") as InspectStateSlice,
      targetId
    );
    if (result) {
      return result;
    }
  }

  for (let [index] of task.children.entries()) {
    let result = findSliceById(slice.slice("children", index), targetId);
    if (result) {
      return result;
    }
  }

  return undefined;
}
