import { main, send, receive, any, Operation } from 'effection';

let context = main(function*() { yield });

// with no arguments
let operation: Operation = receive();

// with context
operation = receive(context);

// with pattern matching
operation = receive("foo");
operation = receive({ some: "foo" });
operation = receive([1, true, "string"]);

// with context and pattern matching
operation = receive("foo", context);
operation = receive({ some: "foo" }, context);
operation = receive([1, true, "string"], context);
operation = receive((val: number) => val % 2 === 0, context);

// with any matcher
operation = receive(any());
operation = receive(any("number"));
operation = receive(any("array"));

// any matcher is callable
let matcher: (value: any) => boolean = any("number");
let result: boolean = matcher(123);

operation = send({a: "message"});
operation = send("message", context);
