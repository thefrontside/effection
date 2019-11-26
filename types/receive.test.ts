import { fork, receive, any, Controller } from 'effection';

let someFork = fork(function*() { yield });

// with no arguments
let someController: Controller = receive();

// with fork
receive(someFork);

// with pattern matching
receive("foo");
receive({ some: "foo" });
receive([1, true, "string"]);

// with fork and pattern matching
receive(someFork, "foo");
receive(someFork, { some: "foo" });
receive(someFork, [1, true, "string"]);
receive(someFork, (val: number) => val % 2 === 0);

// with any matcher
receive(any());
receive(any("number"));
receive(any("array"));

// any matcher is callable
let matcher: (value: any) => boolean = any("number");
let result: boolean = matcher(123);
