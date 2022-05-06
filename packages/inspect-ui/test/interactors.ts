import { HTML } from '@interactors/html';

export const Task = HTML.extend('task')
  .selector('.task')
  .locator((element) => element.querySelector('.task--title--name')?.textContent?.trim() || "")
  .filters({
    name: (element) => element.querySelector('.task--title--name')?.textContent?.trim() || "",
    taskId: (element) => element.querySelector('.task--title--id')?.textContent?.trim() || "",
    type: (element) => element.querySelector('.task--title--type')?.textContent?.trim() || "",
    open: (element) => element.querySelector('.task--details')?.classList.contains('open'),
  });

export const YieldingToTask = Task.extend('yielding to task').selector('.task--yielding-to .task');
export const ChildTask = Task.extend('child task').selector('.task--list .task');

export const Label = HTML.extend('label')
  .selector('.task--label')
  .locator((element) => element.querySelector('.task--label--title')?.textContent?.trim() || "")
  .filters({
    value: (element) => element.querySelector('.task--label--value')?.textContent?.trim() || "",
  });
