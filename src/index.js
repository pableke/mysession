
//required node modeules
const url = require("url"); //url parser
const http = require("http"); //http server
const session = require("./mysession"); //session handler

// Settings
session.open();

//create server instance
const server = http.createServer(function(req, res) {
	let parts = url.parse(req.url.toLowerCase(), true); //parse url
	let pathname = parts.pathname; //https://example.org/abc/xyz?123 = /abc/xyz
	//Static request => res.end()
	if (pathname.indexOf("/favicon.ico") > -1)
		return res.end(); //ignore icon request

	session.init(req, res);
	console.log(req.session);
	res.end(JSON.stringify(req.session), "application/json", () => {
		console.log(">", req.url, req.method, (Date.now() - req.session.mtime) + " ms");
	});
});

//capture Node.js Signals and Events
function fnExit(signal) { //exit handler
	console.log("------------------");
	console.log("> Received [" + signal + "].");
	session.close();
	server.close();
	console.log("> Http server closed.");
	console.log("> " + (new Date()));
	process.exit(0);
};
server.on("close", fnExit); //close server event
process.on("exit", function() { fnExit("exit"); }); //common exit signal
process.on("SIGHUP", function() { fnExit("SIGHUP"); }); //generated on Windows when the console window is closed
process.on("SIGINT", function() { fnExit("SIGINT"); }); //Press Ctrl-C / Ctrl-D keys to exit
process.on("SIGTERM", function() { fnExit("SIGTERM"); }); //kill the server using command kill [PID_number] or killall node
process.stdin.on("data", function(data) { (data == "exit\n") && fnExit("exit"); }); //console exit

//start http and https server
let port = process.env.port || 3000;
server.listen(port, "localhost");

console.log("> Server running at http://localhost:" + port + "/");
console.log("> " + (new Date()));
