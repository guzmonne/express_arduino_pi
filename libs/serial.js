var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var randomInt;

var serialPort = new SerialPort("/dev/ttyUSB0", {
	baudrate: 9600,
	parser: serialport.parsers.readline('\n')
});

exports.serialPort = serialPort;

serialPort.on("open", function(){
	console.log("Connection Open");

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

function inBrackets(data){
	return '{' + data + '}';
}


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