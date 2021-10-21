import { describe, it } from '@effection/mocha';
import expect from 'expect';

import { spawn } from 'effection';
import { ClientMessage } from '@effection/inspect-utils';
import { createWebSocketClient, WebSocketClient } from '@effection/websocket-client';
import { createInspectServer, InspectServer } from '../src/index';

type Message = { value: string };

describe("createInspectServer()", () => {
  it('sreams inspect trees', function*() {
    let task = yield spawn(undefined, { labels: { name: 'foo' } });
    let child = yield task.spawn(undefined, { labels: { name: 'bar' } });
    let server: InspectServer = yield createInspectServer({ task });

    let client: WebSocketClient<Message> = yield createWebSocketClient<Message>(`ws://localhost:${server.port}`);

    let result: ClientMessage = yield client.expect();

    expect(result).toEqual({
      type: 'start',
      task: expect.objectContaining({
        id: task.id,
        labels: { name: 'foo' },
      })
    });
  });
});
