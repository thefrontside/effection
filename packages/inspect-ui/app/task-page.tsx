import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { InspectStateSlice } from "./app";
import { TaskTreePage } from "./task-tree-page";

export function TaskPage({ slice }: { slice: InspectStateSlice }): JSX.Element {
  let { id } = useParams();

  let targetSlice = findSliceById(slice, Number(id));
  if (targetSlice) {
    return (
      <div>
        <p>
          <Link to="/" className="inspector--main--return">
            ← Show all
          </Link>
        </p>

        <TaskTreePage slice={targetSlice} />
      </div>
    );
  } else {
    return <Navigate to="/" />;
  }
}

function findSliceById(
  slice: InspectStateSlice,
  targetId: number
): InspectStateSlice | undefined {
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
