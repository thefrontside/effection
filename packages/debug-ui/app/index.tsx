import { main } from '@effection/main';
import { createWebSocketClient, WebSocketClient } from '@effection/websocket-client';
import { EffectionContext } from '@effection/react';
import { DebugTree } from '@effection/debug-utils';

import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './app';

main(function*(scope) {
  let url = new URL(location);
  let port = url.searchParams.get('port') || location.port;

  let client: WebSocketClient<DebugTree> = yield createWebSocketClient(`ws://localhost:${port}`);
  console.log("Client connected");

  ReactDOM.render(
    <EffectionContext.Provider value={scope}>
      <App client={client}/>
    </EffectionContext.Provider>,
    document.querySelector('#app')
  )
  yield;
});
