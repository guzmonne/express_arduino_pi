// REDIS
// =====
var redis      = require("redis");
var client     = redis.createClient();
client.select(2, function(){
	console.log("Connected to Redis");
});
client.on("error", function(err){
	console.log("error: " + err);
});
// SerialPort
// ==========
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
// Vent
// ====
var Vent       = require('./vent');
var randomInt;

var serialPort = new SerialPort("/dev/ttyUSB0", {
	baudrate: 9600,
	parser  : serialport.parsers.readline('\n')
});

var serialShield = new SerialPort('/dev/ttyACM0', {
	baudrate: 9600,
	parser  : serialport.parsers.readline('\n')
});

exports.serialPort = serialPort;
exports.serialShield = serialShield;


serialPort.on("open", function(){
	console.log("Connection to RedBoard Open");

	// Subscribe to events
	// ===================
	// Receive data
	// ------------
	serialPort.on("data", function(data){
		console.log("Data: " + data);
	});
	
	// Change LED color
	// ----------------
	serialPort.on("color_led", function(color){
		console.log('Chainging LED color');
		serialPort.write(inBrackets(parseInt(color)), function(err, results){
			if (err)
				return console.log(err);
			console.log( results  + ' bytes where sent');
		});
	}); 
});

serialShield.on("open", function(){
	console.log("Connection to ShieldBoard Open");

	// Subscribe to events
	// ===================
	// Receive data
	// ------------
	serialShield.on("data", function(data){
		// var sData = data.split(":");
		// var sLength = sData.length;
		// sData[sLength - 1] = sData[sLength - 1].split("\r")[0];
		// console.log(sData);
		var sData = parseData(data);
		reactToData(sData);
	});
});

function parseData(data){
	var sData  = data.split(":");
	var length = sData.length;
	sData[length - 1] = sData[length - 1].split("\r")[0];
	console.log(sData);
	return sData;
};

function reactToData(data){
	switch(data[0]){
		case "whiteButton":
			whiteButton(data);
			break;
		case "humidity":
			saveDataString(data);
			break;
		case "temperature":
			saveDataString(data);
			break;
	};
};

function whiteButton(sData){
	if (sData[1] === '0'){
		//console.log("Button OFF");
		var value = 0;
	} else {
		//console.log("Button ON");
		var value = 1;
	}

	Vent.propagateEvent({
		srvEvent: "whiteButton",
		data: {
			event: "whiteButton",
			data : value
		}
	});
};

function createKey(name){
	var timestamp = new Date().getTime();
	return name + ":" + timestamp
};

function createDataObject(data){
	var timestamp = new Date().getTime();
	var object = {
		key : data[0],
		score:  timestamp,
		member: '{timestamp: ' + timestamp + ', ' + data[0] + ': ' + data[1] + '}'
	}
	return object;
};

function saveDataString(data){
	//var key = createKey(data[0]);
	//client.set(key, data[1], redis.print);
	var object = createDataObject(data);
	client.zadd(object.key, object.score, object.member, function(err, reply){
		if (err){
			console.log("Redis Error: " + err);
		}
		console.log(reply);
	});
};

function inBrackets(data){
	return '{' + data + '}';
};

function sendRandomNumber() {
	setInterval(function(){
		randomInt = Math.floor(Math.random()*768)
		serialPort.write('{' + randomInt + '}', function(err, results){
			if (err)
				return console.log('err: ', err);
			console.log('results: ' + results);
		});
	}, 10000);
}