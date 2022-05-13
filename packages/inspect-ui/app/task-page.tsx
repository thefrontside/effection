import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { InspectStateSlice } from "./app";
import { TaskTreePage } from "./task-tree-page";
import { findSliceById } from "./utils/find-slice-by-id";

export function TaskPage({ slice }: { slice: InspectStateSlice }): JSX.Element {
  let { id } = useParams();

  let targetSlice = findSliceById(slice, Number(id));
  if (targetSlice) {
    return (
      <TaskTreePage slice={targetSlice} showCollapsed={true} basePath="../" />
    );
  } else {
    return <Navigate to=".." />;
  }
}
