import React, { useContext } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Chip, Link, Typography } from "@material-ui/core";
import { InspectState } from "@effection/inspect-utils";
import TreeItem from "@material-ui/lab/TreeItem";
import { SettingsContext } from "./settings";
import { TaskIcon } from "./task-icon";

type TreeProps = {
  task: InspectState;
  isYielding?: boolean;
};

export function TaskTreeItem({ task, isYielding }: TreeProps): JSX.Element {
  let { settings } = useContext(SettingsContext);
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
      {isYielding && "yield"}
      <TaskIcon state={task.state} color="inherit" />
      <Link component={RouterLink} to={`/tasks/${task.id}`}>
        {name}
      </Link>
      {labels.map(([key, value]) => (
        <Chip
          key={key}
          label={
            <>
              <span>{key}</span>: <span>{value}</span>
            </>
          }
        />
      ))}
      <Typography variant="body1" component="span">{task.type}</Typography>
      <Typography variant="body1" component="span">[id]: {task.id}</Typography>
    </div>
  );

  if (task.yieldingTo || visibleChildren.length > 0) {
    return (
      <TreeItem nodeId={`${task.id}`} label={label}>
        {task.yieldingTo && (
          <TaskTreeItem task={task.yieldingTo} isYielding={true} />
        )}
        {visibleChildren.map((child) => (
          <TaskTreeItem key={child.id} task={child} />
        ))}
      </TreeItem>
    );
  } else {
    return <TreeItem nodeId={`${task.id}`} label={label} />;
  }
}

// return (
//   <div className={`task ${task.state}`}>
//     <div className="task--title">
//       {task.yieldingTo || visibleChildren.length ? (
//         <button
//           className="task--title--expand"
//           title={(isOpen ? "Collapse" : "Expand") + " " + name}
//           onClick={() => setOpen(!isOpen)}
//         >
//           {isOpen ? "-" : "+"}
//         </button>
//       ) : (
//         <button disabled className="task--title--expand disabled"></button>
//       )}
//       {isYielding ? <div className="task--title--yield">yield</div> : null}
//       <TaskIcon state={task.state} />
//       <div className="task--title--name">
//         <Link to={`/tasks/${task.id}`}>{name}</Link>
//       </div>
//       {labels.map(([key, value]) => {
//         return (
//           <div className="task--label" key={key}>
//             <div className="task--label--title">{key}</div>
//             <div className="task--label--value">{value}</div>
//           </div>
//         );
//       })}
//       <div className="task--title--type">{task.type} </div>
//       <div className="task--title--id">[id: {task.id}] </div>
//     </div>

//     {isOpen ? (
//       <>
//         <div className="task--details">
//           {task.error && settings.showStackTraces ? (
//             <div className="task--error">
//               <div className="task--error--stack">{task.error.stack}</div>
//             </div>
//           ) : null}

//           {task.yieldingTo ? (
//             <>
//               <div className="task--yielding-to">
//                 <TaskTree task={task.yieldingTo} isYielding={true} />
//               </div>
//             </>
//           ) : null}

//           {visibleChildren.length ? (
//             <>
//               <ol className="task--list">
//                 {visibleChildren.map((child) => {
//                   return (
//                     <li className="task--list--element" key={child.id}>
//                       <TaskTree task={child} />
//                     </li>
//                   );
//                 })}
//               </ol>
//             </>
//           ) : null}
//         </div>
//       </>
//     ) : null}
//   </div>
// )
