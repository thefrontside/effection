import React, { useCallback, useMemo } from "react";
import { useSlice } from "@effection/react";
import { Navigate } from "react-router-dom";
import { InspectStateSlice } from "./app";
import { TaskTree } from "./components/task-tree";
import { useSearchParams, useNavigate } from "react-router-dom";
import { parse, stringify } from "query-string";
import { InspectState } from "@effection/inspect-utils";

export function TaskTreePage({
  slice,
  showCollapsed
}: {
  slice: InspectStateSlice;
  showCollapsed: boolean;
}): JSX.Element {
  let task = useSlice(slice);

  let [searchParams] = useSearchParams();
  let navigate = useNavigate();

  let initial = useMemo(() => {
    return showCollapsed ? [] : getInitialCollapsed(task);
  }, [showCollapsed, task]);

  let collapsed = useMemo(() => {
    let { collapsed } = parse(searchParams.toString(), {
      arrayFormat: "comma",
    });

    if (Array.isArray(collapsed)) {
      return collapsed.filter((s): s is string => Boolean(s));
    } else {
      if (collapsed) {
        return [collapsed];
      } else {
        return initial;
      }
    }
  }, [searchParams, initial]);

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
    return <Navigate to=".." />;
  }
}

function getInitialCollapsed(task: InspectState): string[] {
  let initial: string[] = [];
  function pushChild(child: InspectState) {
    if (child.labels.expand === false) {
      initial.push(`${child.id}`);
    }
    if (child.yieldingTo) {
      pushChild(child.yieldingTo);
    }
    child.children.forEach(pushChild);
  }
  pushChild(task);
  return initial;
}
