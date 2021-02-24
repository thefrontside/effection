# @effection/node

Work in Node.js with Effection

## Synopsis

``` typescript
import { sleep } from 'effection';
import { main } from '@effection/node';

main(function* sayHello() {
  console.log('Hello World!');
  yield sleep(2000);
  console.log('Goodbye World!')
});
```
