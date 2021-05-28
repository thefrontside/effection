# @effection/main

Entry point for Effection applications which provides nice setup and teardown.
Works both in node and browser contexts.

## Usage

``` typescript
import { sleep } from '@effection/core';
import { main } from '@effection/main';

main(function* sayHello() {
  console.log('Hello World!');
  yield sleep(2000);
  console.log('Goodbye World!')
});
```
