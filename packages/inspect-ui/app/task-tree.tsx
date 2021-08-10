import React, { useState } from 'react';
import { InspectTree } from '@effection/inspect-utils';

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
  tree: InspectTree;
}

export function TaskTree({ tree }: TreeProps): JSX.Element {
  let [isOpen, setOpen] = useState<boolean>(true);
  let name = tree.labels.name || 'task';
  let children = Object.values(tree.children);
  let labels = Object.entries(tree.labels).filter(([key]) => key !== 'name');
  return (
    <div className={`task ${tree.state}`}>
      <div className={`task--state ${tree.state}`}>
        {tree.yieldingTo || children.length ? <>
          <button title={(isOpen ? 'Collapse' : 'Expand') + ' ' + name} onClick={() => setOpen(!isOpen)}>
            {isOpen ? '-' : '+'}
          </button>
        </> : null}
      </div>
      <div className="task--title">
        <div className="task--title--icon">
          {ICONS[tree.state]}&nbsp;
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
        <div className="task--title--type">{tree.type} </div>
        <div className="task--title--id">[{tree.id}] </div>
      </div>

      {isOpen ? <>
        <div className="task--details">
          {tree.yieldingTo ? <>
            <div className="task--yielding-to">
              <TaskTree tree={tree.yieldingTo}/>
            </div>
          </> : null}

          {children.length ? <>
            <h6 className="task--section-header">Children</h6>

            <ol className="task--list">
              {
                children.map((child) => {
                  return (
                    <li className="task--list--element" key={child.id}>
                      <TaskTree tree={child}/>
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
