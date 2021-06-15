import { createWebSocketClient } from '@effection/websocket-client';
import { main, spawn, on } from 'effection';

// main(function* (scope) { // for without on()
main(function* (scope) {
  let client = yield createWebSocketClient('wss://echo.websocket.org'); 
    // createwebsocketclient() assumes it'll receive json

  console.log('Created websocket...');

  yield spawn(client.forEach(( value ) => {
    console.log('server sent:', value);
  }));
  // spawn runs concurrently
    // meant to run in the background. okay to exit.
  // daemon = function => return operation => starts a process
    // for processes (it uses spawn() internally)
    // daemon should never exit

  // with effection on()
  yield on(process.stdin, 'data').forEach(data => {
    // on() takes void or operation
    return client.send(data.toString()); // client.send() doesn't do the send(), it returns an operation that passes the "function" through to on() i think
  });
  // purpose of on() is to create a stream of things already happening inside the scope
    // on() lets us not have to worry about scope.. ish

  // // without on()
  // let send = (data) => {
  //   scope.spawn(client.send(data.toString()));
  // };
  // try {
  //   process.stdin.on('data', send);
  //   yield;
  // } finally {
  //   process.stdin.off('data', send);
  // }

});