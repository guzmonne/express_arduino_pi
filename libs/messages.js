// REDIS
// =====
var redis      = require('redis');
var client     = redis.createClient();
// Initialize
// ----------
client.select(2, function(){
	console.log('Connected to Redis');
});
client.on('error', function(err){
	console.log('error: ' + err);
});

exports.createMessage = function (req, res, callback){
	var attr = {
		id        : req.body.timestamp,
		message   : req.body.message,
		expiration: req.body.expiration
	};
	var message = JSON.stringify(attr);
	client.zadd('messages', attr.id, message, function(err, reply){
		if (err){
			console.log('Redis: ' +  err);
		}
		console.log(reply);
	});
	if (typeof(callback) === "function"){
		callback(attr);
	}
	res.send(200, message);
};

exports.saveMessage = function (attr, callback){
	var message = JSON.stringify(attr);
	client.zadd('messages', attr.id, message, function(err, reply){
		if (err){
			console.log('Redis: ' +  err);
		}
		console.log(reply);
	});
	callback(message);
};

exports.delMessage = function (id){
	client.zremrangebyscore('messages', id, id, function(err, results){
		if (err) {
			console.log('Redis Error: ' + err);
		}
		console.log(results);
	});
};