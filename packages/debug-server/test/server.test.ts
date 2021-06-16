import { describe, it } from '@effection/mocha';
import expect from 'expect'

import { ClientMessage } from '@effection/debug-utils';
import { createWebSocketClient } from '@effection/websocket-client';
import { createDebugServer, DebugServer } from '../src/index';

type Message = { value: string };

describe("createDebugServer()", () => {
  it('sreams debug trees', function*(world) {
    let task = world.spawn(undefined, { labels: { name: 'foo' } });
    let child = task.spawn(undefined, { labels: { name: 'bar' } });
    let server: DebugServer = yield createDebugServer({ task });

    let client = yield createWebSocketClient<Message>(`ws://localhost:${server.port}`);

    let result: ClientMessage = yield client.expect();

    expect(result.type).toEqual('tree');
    expect(result.tree.id).toEqual(task.id);
    expect(result.tree.labels.name).toEqual('foo');
    expect(result.tree.children[child.id].labels.name).toEqual('bar');
  });
});
