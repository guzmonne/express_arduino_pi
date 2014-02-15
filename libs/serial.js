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
// SerialPort
// ==========
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
// Vent
// ====
var Vent       = require('./vent');
var randomInt;
// Async
// =====
var async = require('async');
// Messages
// ========
var msg = require('../libs/messages');

// Messages Array
var messages = [];

var serialPort = new SerialPort('/dev/ttyUSB0', {
	baudrate: 9600,
	parser  : serialport.parsers.readline('\n')
});

var serialShield = new SerialPort('/dev/ttyACM0', {
	baudrate: 9600,
	parser  : serialport.parsers.readline('\n')
});

exports.serialPort   = serialPort;
exports.serialShield = serialShield;

serialPort.on('open', function(){
	console.log('Connection to RedBoard Open');
	// Initialize RedBoard
	// ===================
	// We give the board some time before we initialize the values
	setTimeout(function(){
		// Stored LED Color
		// ----------------
		client.get('color_led', function(err, color){
			if (err){
				console.log('Redis Error: ' + err);
			}
			serialPort.write(inBrackets(parseInt(color)), function(err){
				if (err){
					console.log('Serial Error: ' + err);
				}
				console.log('LED Color = ' + color);
			});
		});
	}, 5000);
	// Subscribe to events
	// ===================
	// Receive data
	// ------------
	serialPort.on('data', function(data){
		console.log('Data: ' + data);
	});
	// Change LED color
	// ----------------
	serialPort.on('color_led', function(color){
		//console.log('Chainging LED color');
		serialPort.write(inBrackets(parseInt(color)), function(err){
			if (err){
				return console.log(err);
			}
			client.set('color_led', parseInt(color), function(err, reply){
				if (err){
					console.log('Redis error: ' + err);
				}
				console.log(reply);
			});
			//console.log( results  + ' bytes where sent');
		});
	});
	// Received new message
	// --------------------
	serialPort.on('new_message', function(message){
		messages.push(message);
		console.log(messages);
		// If this is the only message start the loop
		if (messages.length === 1){
			startMessageLoop();
		}
	});
	// Send message
	// ------------
	serialPort.on('send_message', function(message){
		serialPort.write(inSquareBrackets(message), function(err){
			if (err){
				return console.log('Serial Error: ' + err);
			}
		});
	});
	// Edit message
	// ------------
	serialPort.on('edit_message', function(message){
		async.filter(messages, function(el, callback){
			if (el.id === message.id){
				return callback(false);
			} else {
				callback(true);
			}
		}, function(results){
			messages = results;
			messages.push(message);
		});
	});
	// Delete message
	// --------------
	serialPort.on('delete_message', function(id){
		async.filter(messages, function(el, callback){
			if (el.id === id){
				return callback(false);
			} else {
				callback(true);
			}
		}, function(results){
			messages = results;
		});
	});
	// Initialize message delivery
	// ---------------------------
	fetchMessages();
});

serialShield.on('open', function(){
	console.log('Connection to ShieldBoard Open');

	// Subscribe to events
	// ===================
	// Receive data
	// ------------
	serialShield.on('data', function(data){
		var sData = parseData(data);
		reactToData(sData);
	});
	// Move servo
	// ----------
	serialShield.on('servo_move', function(degrees){
		serialShield.write(inBrackets(parseInt(degrees)), function(err){
			if (err){
				return console.log(err);
			}
			client.set('servo_value', parseInt(degrees), function(err, reply){
				if (err){
					console.log('Redis error: ' + err);
				}
				console.log(reply);
			});
		});
	});
});

function randomServo(){
	setInterval(function(){
		var randomnumber=Math.floor(Math.random()*180);
		console.log('New Servo value: ' + randomnumber);
		serialShield.emit('servo_move', randomnumber);
	}, 10000);
}

function parseData(data){
	var sData  = data.split(':');
	var length = sData.length;
	sData[length - 1] = sData[length - 1].split('\r')[0];
	return sData;
}

function reactToData(data){
	switch(data[0]){
		case 'whiteButton':
			whiteButton(data);
			break;
		case 'humidity':
			saveDataString(data);
			break;
		case 'temperature':
			saveDataString(data);
			break;
	}
}

function whiteButton(sData){
	var value;
	if (sData[1] === '0'){
		//console.log('Button OFF');
		value = 0;
	} else {
		//console.log('Button ON');
		value = 1;
		// Create object and save on Redis
		var object = createDataObject(['ringbell', value]);
		zAddObject(object);
	}
	// Propagate Event
	Vent.propagateEvent({
		srvEvent: 'whiteButton',
		data: {
			event: 'whiteButton',
			data : value
		}
	});
}

function createKey(name){
	var timestamp = new Date().getTime();
	return name + ':' + timestamp;
}

function createDataObject(data){
	var timestamp = new Date().getTime();
	var member = {timestamp: timestamp};
	member[data[0]] = data[1];
	var object = {
		key : data[0],
		score:  timestamp,
		member: JSON.stringify(member)
	};
	return object;
}

function saveDataString(data){
	var object = createDataObject(data);
	zAddObject(object);
}

function zAddObject(object){
	client.zadd(object.key, object.score, object.member, function(err, reply){
		if (err){
			console.log('Redis Error: ' + err);
		}
		console.log(reply);
	});
}

function inBrackets(data){
	return '{' + data + '}';
}

function inSquareBrackets(data){
	return '[' + data + ']';
}

function sendRandomNumber() {
	setInterval(function(){
		randomInt = Math.floor(Math.random()*768);
		serialPort.write('{' + randomInt + '}', function(err, results){
			if (err) {
				return console.log('err: ', err);
			}
		});
	}, 10000);
}

function fetchMessages(){
	client.zrange('messages', 0, -1, function(err, results){
		results.forEach(function(message){
			messages.push(JSON.parse(message));
		});
		startMessageLoop();
	});
}

function startMessageLoop(){
	var index = 0;
	intervalMonitor = setInterval(function(){
		var msgLength = messages.length;
		if (msgLength === 0){
			serialPort.emit('send_message', 'No messages...');
			return clearInterval(intervalMonitor);
		} else if (msgLength <= index){
			index = 0;
			sendMessage(index);
		} else if (msgLength > index){
			sendMessage(index);
		}
		index = index + 1;
	}, 5000);
}

function sendMessage(index){
	serialPort.emit('send_message', messages[index].message);
	if (messages[index].expiration > 0){
		messages[index].expiration = messages[index].expiration - 1;
		Vent.propagateEvent({
			srvEvent: 'message:expiration:decrese',
			data: {
				event: 'message:expiration:decrese',
				data : messages[index].id
			}
		});
		msg.delMessage(messages[index].id);
		if (messages[index].expiration === 0){
			messages.slice(index);
		} else {
			msg.saveMessage(messages[index], function(message){
				console.log(message);
			});
		}
	}
}