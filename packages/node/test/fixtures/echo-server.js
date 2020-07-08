console.log("starting server");
require('http').createServer((request,response) => {
  console.log("got request");
  response.writeHead(200);
  request.pipe(response);
}).listen(process.env.PORT, function() {
  console.log("listening");
});
process.on("message", function(message) {
  console.log("got message", message);
  process.send(message);
});
