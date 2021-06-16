if (process.env.EFFECTION_INCLUDE_DEBUGGER || process.env.NODE_ENV !== 'production') {
  require('@effection/debug-server').runDebugServer();
}
