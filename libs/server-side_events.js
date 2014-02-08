// ===================
// MODULE DEPENDENCIES
// ===================
var SSE       = require('sse');
//var SSEClient = require('sseclient');
var Vent      = require('./vent');

// ==================
// SERVER-SIDE EVENTS
// ==================
module.exports.sseInit = function(req, res) {
	var client = new SSE.Client(req, res);
	client.initialize();
  Vent.addClient(client);
  Vent.connectClient(client);
  Vent.subscribe(client.id, 'whiteButton');
}

module.exports.serverInit = function(server) {
	var sse = new SSE(server);

	sse.on('connection', function(client){
		Vent.addClient(client);
		Vent.connectClient(client);
	});
}
