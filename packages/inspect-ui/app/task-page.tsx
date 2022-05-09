import React from "react";
import Link from "@material-ui/core/Link";
import { useParams, Link as RouterLink, Navigate } from "react-router-dom";
import { InspectStateSlice } from "./app";
import { findSliceById } from "./find-slice-by-id";
import { TaskTreePage } from "./task-tree-page";

export function TaskPage({ slice }: { slice: InspectStateSlice }): JSX.Element {
  let { id } = useParams();

  let targetSlice = findSliceById(slice, Number(id));
  if (targetSlice) {
    return (
      <div>
        <p>
          <Link to="/" component={RouterLink}>
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


