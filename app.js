// =========
// NEW RELIC
// =========
require('newrelic');

/**
 * Module dependencies.
 */

var express = require('express')
	, routes = require('./routes')
	, http   = require('http')
	, path   = require('path')
	, sse    = require('./libs/server-side_events');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {layout: true});
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('S3cr3t'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/color_led', routes.colorLed);
app.post('/color_led', routes.changeColorLed);
app.get('/sse', sse.sseInit);
app.get('/temperatures', routes.temperatures);
app.get('/humidities', routes.humidities);
app.get('/messages', routes.getMessages);
app.post('/messages', routes.createMessage);
app.put('/messages/:id', routes.editMessage);
app.delete('/messages/:id', routes.deleteMessage);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
