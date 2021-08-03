import { main } from '@effection/main';

main(function*() {
  if (process.env.EFFECTION_INCLUDE_INSPECTOR || process.env.NODE_ENV !== 'production') {
    let { runInspectServer } = yield import('@effection/inspect-server');

    runInspectServer();
  }
});
