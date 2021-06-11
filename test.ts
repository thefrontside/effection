import fetch from 'node-fetch';

async function printDay() {
  let response = await fetch("http://worldclockapi.com/api/json/est/now");
  let time = await response.json();

  console.log(`It is ${time.dayOfTheWeek}, my friends!`);
}

printDay();
