import React, { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Chip, Link, Typography } from "@material-ui/core";
import { InspectState } from "@effection/inspect-utils";
import TreeItem from "@material-ui/lab/TreeItem";
import { TaskIcon } from "./task-icon";
import { useStyles } from "../hooks/use-styles";

type TreeProps = {
  task: InspectState;
  isYielding?: boolean;
  childFilter: (child: InspectState) => boolean;
};

export function TaskTreeItem({
  task,
  isYielding,
  childFilter,
}: TreeProps): JSX.Element {
  let classes = useStyles();

  let name = task.labels.name || "task";
  let labels = Object.entries(task.labels).filter(
    ([key, value]) => key !== "name" && key !== "expand" && value != null
  );

  let visibleChildren = useMemo(
    () => (task.children ?? []).filter(childFilter),
    [task.children, childFilter]
  );

  let label = (
    <>
      {isYielding && <YieldText />}
      <TaskIcon state={task.state} color="inherit" />
      <Link
        className={`task--title--name ${classes.linkText}`}
        component={RouterLink}
        to={`${task.id}`}
      >
        {name}
      </Link>
      {labels.map(([key, value]) => (
        <LabelChip key={key} name={key} value={value} />
      ))}
      <TypeText type={task.type} />
      <IdText taskId={task.id} />
    </>
  );

  if (task.yieldingTo || visibleChildren.length > 0) {
    return (
      <TreeItem
        className={`task ${task.yieldingTo ? "task--yielding-to" : null} ${
          classes.treeItem
        }`}
        nodeId={`${task.id}`}
        label={label}
      >
        {task.yieldingTo && (
          <TaskTreeItem
            task={task.yieldingTo}
            isYielding={true}
            childFilter={childFilter}
          />
        )}
        {visibleChildren.map((child) => (
          <TaskTreeItem key={child.id} task={child} childFilter={childFilter} />
        ))}
      </TreeItem>
    );
  } else {
    return (
      <TreeItem
        className={`task ${classes.treeItem}`}
        nodeId={`${task.id}`}
        label={label}
      />
    );
  }
}

function YieldText() {
  let classes = useStyles();
  return (
    <Typography className={classes.yieldText} component="span">
      yield
    </Typography>
  );
}

function TypeText({ type }: { type: string }) {
  let classes = useStyles();
  return (
    <Typography
      className={`task--title--type ${classes.typeText}`}
      component="span"
    >
      {type}
    </Typography>
  );
}

function IdText({ taskId }: { taskId: string | number }) {
  let classes = useStyles();
  return (
    <Typography
      className={`task--title--id ${classes.idText}`}
      component="span"
    >
      [id: {`${taskId}`}]
    </Typography>
  );
}

function LabelChip({
  name,
  value,
}: {
  name: string;
  value: string | number | boolean;
}) {
  let classes = useStyles();
  return (
    <Chip
      component="span"
      className={`task--label ${classes.labelChip}`}
      size="small"
      label={
        <>
          <span className={`task--label--title ${classes.labelChipName}`}>
            {name}
          </span>
          : <span className={`task--label--value`}>{value}</span>
        </>
      }
    />
  );
}
