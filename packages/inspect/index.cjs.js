if (process.env.EFFECTION_INCLUDE_INSPECTOR || process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@effection/inspect-server').runInspectServer();
}
