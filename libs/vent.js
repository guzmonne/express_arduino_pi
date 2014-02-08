var events = require('events');
var util  = require('util');

// module.exports = function () {
//   var vent = new Vent();
//   return vent;
// };

util.inherits(Vent, events.EventEmitter);

function Vent () {
	var self = this;

	self.clients = {};
}


Vent.prototype = {
	addClient : function(client) {
		var self = this;
		self._getOrSetId(client);
		id = client.id;
		self.clients[id] = client;
		
		// Create listener to remove client when the connection fails
		client.on('close', function(){
			//console.log("Client with id " + client.id + " disconnected");
			delete self.clients[id];
		});

		//console.log("New client added with id:" + client.id);
		return this;
	},

	connectClient : function(client) {
		var self = this;

		if(!client.id){
			this._getOrSetId(client);
		}

		var sseSubs = client.req.session.sseSubs;

		if(sseSubs){
			for (var i = 0; i < sseSubs.length; i++){
				self.subscribeClient(client, sseSubs[i]);
			}
		} else {
			client.req.session.sseSubs = [];
		}

		//client.send("sse::connection", "The connection was Successfull", client.id);
		return this;
	},

	_getOrSetId : function(client) {
		if (client.req.headers['last-event-id']){
			var _id = client.req.headers['last-event-id'];
		} else {			
			var _id = new Date().getTime();
		}
		if (!client.id)
			client.id = _id;
		return this;
	},

	subscribeClient: function(client, subscription){
		client.on(subscription, function(data){
			//console.log("Client ", this.id , " is responding to " , data);
			client.send(JSON.stringify(data));
		})

		return this;
	},

	subscribe: function(clientID, subscription){
		var self = this;

		var client =  self.clients[clientID];

		if (client){
			if (client.req.session.sseSubs.indexOf(subscription) == -1){
				client.req.session.sseSubs.push(subscription);
				self.subscribeClient(client, subscription);
			}
			//console.log(client.req.session.sseSubs);
		}

		return self;
	},

	propagateEvent: function(eventData){
		var self = this;
		//console.log(eventData);

		for (var clientID in self.clients){
			self.clients[clientID].emit(eventData.srvEvent, eventData.data);
		}
	},
}

module.exports = new Vent();