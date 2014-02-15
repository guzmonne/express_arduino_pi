// SERIAL
// ======
var serial       = require('../libs/serial');
var serialPort   = serial.serialPort;
var serialShield = serial.serialShield;
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
// Messages
// --------
msg = require('../libs/messages');

exports.index = function(req, res){
  res.render('index', { title: 'Express Arduino Pi', menu: 'home' });
};

exports.colorLed = function(req, res){
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

exports.createMessage = function(req, res){
	msg.createMessage(req, res, function(message){
		serialPort.emit('new_message', message);
	});
};

exports.getMessages = function(req, res){
	var begin = req.query.begin;
	var end   = req.query.end;
	sendZRange(begin, end, 'messages', res);
};

exports.editMessage = function(req, res){
	var id = req.params.id;
	msg.delMessage(id);
	msg.createMessage(req, res, function(message){
		serialPort.emit('edit_message', message);
	});
};

exports.deleteMessage = function(req, res){
	var id = req.params.id;
	msg.delMessage(id);
	serialPort.emit('delete_message', id);
	res.send(200, {deletion: 'success'});
};

exports.getServoValue = function(req, res){
	client.get('servo_value', function(err, degrees){
		if (err) {
			console.log('Redis error: ' + err);
		}
		res.send(200, {degrees: degrees});
	});
};

exports.servo = function(req, res){
	var degrees = req.body.degrees;
	serialShield.emit('servo_move', degrees);
	res.send(200, {response: 'It worked'});
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
	serialPort.emit('new_message', attr);
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