// SERIAL
// ======
var serial       = require('../libs/serial');
var serialPort   = serial.serialPort;
var serialShield = serial.serialShield;
// REDIS
// =====
var redis      = require('redis');
var client     = redis.createClient();
client.select(2, function(){
	console.log('Connected to Redis');
});
client.on('error', function(err){
	console.log('error: ' + err);
});

exports.index = function(req, res){
  res.render('index', { title: 'Express Arduino Pi', menu: 'home' });
};

exports.colorLed = function(req, res){
	//res.render('colorLed', { title: 'EAPi: Color LED', menu: 'color_led' });
	client.get('color_led', function(err, color){
		if (err) {
			console.log('Redis error: ' + err);
		}
		res.send(200, {colorLed: color});
	});
};

exports.changeColorLed = function(req, res){
	var color = req.body.color;
	serialPort.emit('color_led', color);
	res.send(200, {response: 'It worked'});
};

//exports.temperatures = function(req, res){
//	if (typeof(req.query.begin) === undefined || req.query.end === undefined){
//		client.zrange('temperature', 0 , -1, function(err, temperatures){
//			if (err){
//				console.log('Redis error: ' + err);
//			}
//			res.send(200, temperatures);
//		});
//	} else {
//		var begin = req.query.begin
//		var end   = req.query.end
//		client.zrangebyscore('temperature', begin, end, function(err, temperatures){
//			if (err){
//				console.log('Redis error: ' + err);
//			}
//			res.send(200, temperatures);
//		});
//	}
//};

exports.temperatures = function(req, res){
	var begin = req.query.begin;
	var end   = req.query.end;
	sendZRange(begin, end, 'temperature', res);
};

exports.humidities = function(req, res){
	var begin = req.query.begin;
	var end   = req.query.end;
	sendZRange(begin, end, 'humidity', res);
};

//exports.humidities = function(req, res){
//	if (typeof(req.query.begin) === undefined || req.query.end === undefined){
//		client.zrange('humidity', 0 , -1, function(err, humidities){
//			if (err){
//				console.log('Redis error: ' + err);
//			}
//			res.send(200, humidities);
//		});
//	} else {
//		var begin = req.query.begin
//		var end   = req.query.end
//		client.zrangebyscore('humidity', begin, end, function(err, humidities){
//			if (err){
//				console.log('Redis error: ' + err);
//			}
//			res.send(200, humidities);
//		});
//	}
//};

exports.createMessage = function(req, res){
	createMessage(req, res);
};

exports.getMessages = function(req, res){
	var begin = req.query.begin;
	var end   = req.query.end;
	sendZRange(begin, end, 'messages', res);
};

exports.editMessage = function(req, res){
	var id = req.params.id;
	delMessage(id);
	createMessage(req, res);
};

exports.deleteMessage = function(req, res){
	var id = req.params.id;
	delMessage(id);
	res.send(200, {deletion: 'success'});
};

function sendZRange(begin, end, key, res){
	if (typeof(begin) === undefined || end === undefined){
		client.zrange(key, 0 , -1, function(err, results){
			if (err){
				console.log('Redis error: ' + err);
			}
			res.send(200, results);
		});
	} else {
		client.zrangebyscore(key, begin, end, function(err, results){
			if (err){
				console.log('Redis error: ' + err);
			}
			res.send(200, results);
		});
	}
}

function createMessage(req, res){
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
	res.send(200, message);
}

function delMessage(id){
	client.zremrangebyscore('messages', id, id, function(err, results){
		if (err) {
			console.log('Redis Error: ' + err);
		}
		console.log(results);
	});
}