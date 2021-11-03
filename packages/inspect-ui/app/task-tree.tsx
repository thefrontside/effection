import React, { useState } from 'react';
import { InspectState } from '@effection/inspect-utils';

const ICONS = {
  pending: "⌛︎",
  running: "↻",
  completing: "✓",
  completed: "✓",
  halting: "◇",
  halted: "◇",
  erroring: "𐄂",
  errored: "𐄂",
};

type TreeProps = {
  task: InspectState;
}

export function TaskTree({ task }: TreeProps): JSX.Element {
  let [isOpen, setOpen] = useState<boolean>((task.labels.expand != null) ? !!task.labels.expand : true);
  let name = task.labels.name || 'task';
  let labels = Object.entries(task.labels).filter(([key, value]) => key !== 'name' && key !== 'expand' && value != null);
  return (
    <div className={`task ${task.state}`}>
      <div className={`task--state ${task.state}`}>
        {task.yieldingTo || task.children.length ? <>
          <button title={(isOpen ? 'Collapse' : 'Expand') + ' ' + name} onClick={() => setOpen(!isOpen)}>
            {isOpen ? '-' : '+'}
          </button>
        </> : null}
      </div>
      <div className="task--title">
        <div className="task--title--icon">
          {ICONS[task.state]}&nbsp;
        </div>
        <div className="task--title--name">
          {name}
        </div>
        {
          labels.map(([key, value]) => {
            return (
              <div className="task--label" key={key}>
                <div className="task--label--title">{key}</div>
                <div className="task--label--value">{value}</div>
              </div>
            );
          })
        }
        <div className="task--title--type">{task.type} </div>
        <div className="task--title--id">[{task.id}] </div>
      </div>

      {isOpen ? <>
        <div className="task--details">
          {task.yieldingTo ? <>
            <div className="task--yielding-to">
              <TaskTree task={task.yieldingTo}/>
            </div>
          </> : null}

          {task.children.length ? <>
            <h6 className="task--section-header">Children</h6>

            <ol className="task--list">
              {
                task.children.map((child) => {
                  return (
                    <li className="task--list--element" key={child.id}>
                      <TaskTree task={child}/>
                    </li>
                  );
                })
              }
            </ol>
          </> : null}
        </div>
      </> : null}
    </div>
  );
}
