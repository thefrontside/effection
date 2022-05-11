import Link from "@material-ui/core/Link";
import React from "react";
import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import { InspectStateSlice } from "./app";
import { TaskTreePage } from "./task-tree-page";
import { findSliceById } from "./utils/find-slice-by-id";

export function TaskPage({ slice }: { slice: InspectStateSlice }): JSX.Element {
  let { id } = useParams();

  let targetSlice = findSliceById(slice, Number(id));
  if (targetSlice) {
    return (
      <div>
        <p>
          <Link to="../" component={RouterLink}>
            ← Show all
          </Link>
        </p>

        <TaskTreePage slice={targetSlice} showCollapsed={true} />
      </div>
    );
  } else {
    return <Navigate to="../" />;
  }
}


