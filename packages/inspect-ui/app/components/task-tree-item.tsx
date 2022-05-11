import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Chip, Link, Typography } from "@material-ui/core";
import { InspectState } from "@effection/inspect-utils";
import TreeItem from "@material-ui/lab/TreeItem";
import { TaskIcon } from "./task-icon";
import { useSettings } from "../hooks/use-settings";
import { useStyles } from "../hooks/use-styles";

type TreeProps = {
  task: InspectState;
  isYielding?: boolean;
};

export function TaskTreeItem({ task, isYielding }: TreeProps): JSX.Element {
  let { settings } = useSettings();
  let classes = useStyles();

  let name = task.labels.name || "task";
  let labels = Object.entries(task.labels).filter(([key, value]) => key !== 'name' && key !== 'expand' && value != null);

  let visibleChildren = task.children.filter((child) => {
    if (child.state === "completed" && !settings.showCompleted) return false;
    if (child.state === "errored" && !settings.showErrored) return false;
    if (child.state === "halted" && !settings.showHalted) return false;
    return true;
  });

  let label = (
    <div>
      {isYielding && <YieldText />}
      <TaskIcon state={task.state} color="inherit" />
      <Link
        className={`task--title--name ${classes.linkText}`}
        component={RouterLink}
        to={`/tasks/${task.id}`}
      >
        {name}
      </Link>
      {labels.map(([key, value]) => (
        <LabelChip key={key} name={key} value={value} />
      ))}
      <TypeText type={task.type} />
      <IdText taskId={task.id} />
    </div>
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
          <TaskTreeItem task={task.yieldingTo} isYielding={true} />
        )}
        {visibleChildren.map((child) => (
          <TaskTreeItem key={child.id} task={child} />
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
    <Typography className={`task--title--type ${classes.typeText}`} component="span">
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

function LabelChip({ name, value }: { name: string, value: string | number | boolean}) {
  let classes = useStyles();
  return (
    <Chip
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

