import {
  createSignal,
  ensure,
  once,
  race,
  resource,
  spawn,
  withResolvers,
} from "effection";
import type { Operation, Stream } from "effection";

/**
 * Handle to a
 * [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) object
 * that can be consumed as an Effection stream. It has all the same properties as
 * the underlying `WebSocket` apart from the event handlers. Instead, the resource
 * itself is a subscribale stream. When the socket is closed, the stream will
 * complete with a [`CloseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent)
 *
 * A WebSocketResource does not have an explicit close method. Rather, the underlying
 * socket will be automatically closed when the resource passes out of scope.
 */
export interface WebSocketResource<T>
  extends Stream<MessageEvent<T>, CloseEvent> {
  /**
   * the type of data that this websocket accepts
   */
  readonly binaryType: BinaryType;
  readonly bufferedAmmount: number;
  readonly extensions: string;
  readonly protocol: string;
  readonly readyState: number;
  readonly url: string;
  send(data: WebSocketData): void;
}

/**
 * Create a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
 * resource using the native
 * [WebSocket constructor](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket)
 * available on the current platform.
 *
 * The resource will not be returned until a connection has been
 * succesffuly established with the server and the
 * [`open`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/open_event)
 * has been received. Once initialized, it will crash if it receives
 * an [`error`]() event at any time.
 *
 * Once created, the websocket resource can be use to consume events from the server:
 *
 * ```ts
 * let socket = yield* useWebSocket("ws://websocket.example.org");
 *
 * for (let event of yield* each(socket)) {
 *   console.log('event data: ', event.data);
 *   yield* each.next();
 * }
 * ```
 *
 * @param url - The URL of the target WebSocket server to connect to. The URL must use one of the following schemes: ws, wss, http, or https, and cannot include a URL fragment. If a relative URL is provided, it is relative to the base URL of the calling script. For more detail, see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#url
 *
 * @param prototol - A single string or an array of strings representing the sub-protocol(s) that the client would like to use, in order of preference. If it is omitted, an empty array is used by default, i.e. []. For more details, see
 *
 * @returns an operation yielding a {@link WebSocketResource}
 */
export function useWebSocket<T>(
  url: string,
  protocols?: string,
): Operation<WebSocketResource<T>>;

/**
 * Create a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
 * resource, but delegate the creation of the underlying websocket to a function
 * of your choice. This is necessary on platforms that do not have a global
 * `WebSocket` constructor such as NodeJS \<= 20.
 *
 * The resource will not be returned until a connection has been
 * succesffuly established with the server and the
 * [`open`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/open_event)
 * has been received. Once initialized, it will crash if it receives
 * an [`error`]() event at any time.
 *
 * Once created, the websocket resource can be use to consume events from the server:
 *
 * ```ts
 * import * as ws from 'ws';
 *
 * function* example() {
 *   let socket = yield* useWebSocket(() => new ws.WebSocket("ws://websocket.example.org"));
 *
 *   for (let event of yield* each(socket)) {
 *     console.log('event data: ', event.data);
 *     yield* each.next();
 *   }
 * }
 *
 * ```
 * @param create - a function that will construct the underlying [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) object that this resource wil use
 * @returns an operation yielding a {@link WebSocketResource}
 */
export function useWebSocket<T>(
  create: () => WebSocket,
): Operation<WebSocketResource<T>>;

/**
 * @ignore the catch-all version that supports both forms above.
 */
export function useWebSocket<T>(
  url: string | (() => WebSocket),
  protocols?: string,
): Operation<WebSocketResource<T>> {
  return resource(function* (provide) {
    let socket =
      typeof url === "string" ? new WebSocket(url, protocols) : url();

    let messages = createSignal<MessageEvent<T>, CloseEvent>();
    let { operation: closed, resolve: close } = withResolvers<CloseEvent>();

    yield* spawn(function* () {
      throw yield* once(socket, "error");
    });

    // Only wait for 'open' if socket isn't already open
    if (socket.readyState !== WebSocket.OPEN) {
      yield* once(socket, "open");
    }

    yield* spawn(function* () {
      let subscription = yield* messages;
      let next = yield* subscription.next();
      while (!next.done) {
        next = yield* subscription.next();
      }
      close(next.value);
    });

    // Don't hoist this above the spawns — teardown would hang waiting on
    // `closed`.
    yield* ensure(function* () {
      socket.close(1000, "released");
      yield* closed;
      socket.removeEventListener("message", messages.send);
      socket.removeEventListener("close", messages.close);
    });

    socket.addEventListener("message", messages.send);
    socket.addEventListener("close", messages.close);

    yield* race([
      closed,
      provide({
        get binaryType() {
          return socket.binaryType;
        },
        get bufferedAmmount() {
          return socket.bufferedAmount;
        },
        get extensions() {
          return socket.extensions;
        },
        get protocol() {
          return socket.protocol;
        },
        get readyState() {
          return socket.readyState;
        },
        get url() {
          return socket.url;
        },
        send: (data) => socket.send(data),
        [Symbol.iterator]: messages[Symbol.iterator],
      }),
    ]);
  });
}

/**
 * @ignore
 */
export type WebSocketData = Parameters<WebSocket["send"]>[0];
