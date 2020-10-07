console.log("starting server");
require('http').createServer((request,response) => {
  process.stderr.write(`got request\n`);
  response.writeHead(200);
  request.pipe(response);

  readCommand(request);

}).listen(process.env.PORT, function(err, x) {
  console.log("listening");
});
process.on("message", function(message) {
  console.log("got message", message);
  process.send(message);
});

function readCommand(request) {
  let command = '';
  request.on('data', data => command += data);
  request.on('end', () => {
    if (command.includes('exit')) {
      console.log('exit(0)');
      process.exit(0);
    } else if (command.includes('fail')) {
      console.log('exit(1)');
      process.exit(1);
    }
  });
}
