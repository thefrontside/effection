import React, { useCallback, useMemo } from "react";
import { useSlice } from "@effection/react";
import { Navigate } from "react-router-dom";
import { InspectStateSlice } from "./app";
import { TaskTree } from "./components/task-tree";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parse, stringify } from "query-string";

export function TaskTreePage({
  slice,
}: {
  slice: InspectStateSlice;
}): JSX.Element {
  let task = useSlice(slice);

  let [searchParams] = useSearchParams();
  let navigate = useNavigate();

  let collapsed = useMemo(() => {
    let { collapsed } = parse(searchParams.toString(), {
      arrayFormat: "comma",
    });

    if (Array.isArray(collapsed)) {
      return collapsed.filter((s): s is string => Boolean(s));
    } else {
      return collapsed ? [collapsed] : [];
    }
  }, [searchParams]);

  let onToggle = useCallback(
    (collapsed: string[]) => {
      navigate({
        search: stringify(
          { collapsed },
          { arrayFormat: "comma" }
        ),
      });
    },
    [navigate]
  );

  if (task) {
    return <TaskTree task={task} collapsed={collapsed} onToggle={onToggle} />;
  } else {
    return <Navigate to="/" />;
  }
}
