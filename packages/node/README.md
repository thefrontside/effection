# @effection/node

Work in Node.js with Effection

## Synopsis

``` typescript
import { timeout } from 'effection';
import { main } from '@effection/node';

main(function* sayHello() {
  console.log('Hello World!');
  yield timeout(2000);
  console.log('Goodbye World!')
});
```
