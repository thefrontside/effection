---
"@effection/node": minor
---
add `exec()` method for creating resource-oriented API for spawning
processes. e.g.

```js
let { stdout, stderr } = yield exec("ls -al");
yield subcribe(stdout).forEach(function*(chunk) {
  console.log(chunk);
});
```

add `dameon()` method which fails if the called process ever quits.
