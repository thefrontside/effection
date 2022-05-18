# @effection/supervisor

A task supervisor similar to Erlang's OTP supervisor module. Supervisors can
monitor other tasks and restart them as needed.

The functionality and options of the Effection supervisor are broadly similar
to Erlang's.

## Known limitations:

Some functionality from Erlang's supervisors is as of yet still missing:

- `simple_one_for_one` supervision strategy
- the `intensity` and `period` options, which prevent restart loops

Contributions for these are very welcome!

## Usage

This packages exposes two methods `runSupervisor` and `createSupervisor`.

With `runSupervisor`, the supervisor runs in the foreground as a task, which
makes it easy to start and keep it running, for example with `main`:

```typescript
import { main } from 'effection';
import { runSupervisor } from '@effection/supervisor';
import { fobrulator, phaseInverter } from './operations';

main(runSupervisor([
  { name: 'fobrulator', run: fobrulator, args: ['fob'] },
  { name: 'phaseInverter', run: phaseInverter, args: [true] },
]);
```

With `createSupervisor`, the supervisor runs in the background as a resource,
which makes it possible to dynamically control the supervisor:

```typescript
import { main } from 'effection';
import { runSupervisor } from '@effection/supervisor';
import { fobrulator, phaseInverter } from './operations';

main(function*() {
  let supervisor = yield createSupervisor();

  supervisor.addChild({ name: 'fobrulator', run: fobrulator, args: ['fob'] });
  supervisor.addChild({ name: 'phaseInverter', run: phaseInverter, args: [true] });

  yield;
]);
```

## Options

The supervisor can currently take the following options:

- `strategy`, one of:
  - `oneForOne`: If one child task terminates and is to be restarted, only that child process is affected. This is the default restart strategy.
  - `oneForAll`: If one child task terminates and is to be restarted, all other child processes are terminated and then all child processes are restarted.
  - `restForOne`: If one child task terminates and is to be restarted, the 'rest' of the child tasks (that is, the child tasks after the terminated child task in the start order) are terminated. Then the terminated child task and all child tasks after it are restarted.
- `shutdown`, one of:
  - `never`: Automic shutdown is disabled. This is the default setting.
  - `anySignificant`: The supervisor will shut itself down when **any** significant child terminates, that is, when a transient significant child terminates normally or when a temporary significant child terminates normally or abnormally.
  - `allSignificant`: The supervisor will shut itself down when **all** significant children have terminated, that is, when the **last active** significant child terminates.

## Child specs

The child specification can contain the following options:

- `name` *required*: A name which identifies the child.
- `run` *required*: A function which returns an operation.
- `args`: a list of arguments to pass to the `run` function.
- `type`: one of:
  - `permanent`: The child is always restart when it terminates, regardless of the reason. Note that children explicitly halted through `haltChild` are not restarted.
  - `transient`: The child is restarted when it errors. It is not restarted when it completes successfully or is halted.
  - `temporary`: The child is never restarted.
- `significant`: See the `shutdown` option for the supervisor.
- `labels`: A set of labels to apply to the child task, which can be helpful when debugging
