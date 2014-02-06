var serialPort = require('../libs/serial').serialPort;

exports.index = function(req, res){
  res.render('index', { title: 'Express Arduino Pi', menu: 'home' });
};

exports.colorLed = function(req, res){
	res.render('colorLed', { title: 'EAPi: Color LED', menu: 'color_led' });
};

exports.changeColorLed = function(req, res){
	var color = req.body.color;
	console.log("The body is: ", color);
	serialPort.emit('color_led', color);
	res.send(200, {response: "It worked"});
}