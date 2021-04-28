import fetch from 'node-fetch';
import { run } from './packages/effection/dist/index.js';

function *printDay() {
  let response = yield fetch("http://worldclockapi.com/api/json/est/now");
  let time = yield response.json();

  console.log(`It is ${time.dayOfTheWeek}, my friends!`);
}

run(printDay);

printDay();
