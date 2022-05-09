import { main } from 'effection';
import { HashRouter } from 'react-router-dom';
import { Slice } from '@effection/atom';
import { createWebSocketClient, WebSocketClient } from '@effection/websocket-client';
import { EffectionContext } from '@effection/react';
import { ClientMessage, InspectState, inspectState } from '@effection/inspect-utils';
import CssBaseline from "@material-ui/core/CssBaseline";

import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './app';

main(function*(scope) {
  let url = new URL(location.href);
  let port = url.searchParams.get('port') || location.port;

  let client: WebSocketClient<ClientMessage> = yield createWebSocketClient(`ws://localhost:${port}`);
  console.log("Client connected");

  let slice: Slice<InspectState> = yield inspectState(client);

  ReactDOM.render(
    <EffectionContext.Provider value={scope}>
      <HashRouter>
        <CssBaseline />
        <App slice={slice}/>
      </HashRouter>
    </EffectionContext.Provider>,
    document.querySelector('#app')
  );
  yield;
});
