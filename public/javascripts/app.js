// Colors from the jQuery plugin
window.Colors = {
	names : {
		aqua          : '#00ffff',
		azure         : '#f0ffff',
		beige         : '#f5f5dc',
		black         : '#000000',
		brown         : '#a52a2a',
		cyan          : '#00ffff',
		darkblue      : '#00008b',
		darkcyan      : '#008b8b',
		darkgrey      : '#a9a9a9',
		darkmagenta   : '#8b008b',
		darkolivegreen: '#556b2f',
		darkorange    : '#ff8c00',
		darkorchid    : '#9932cc',
		darkred       : '#8b0000',
		darksalmon    : '#e9967a',
		darkviolet    : '#9400d3',
		gold          : '#ffd700',
		indigo        : '#4b0082',
		magenta       : '#ff00ff',
		maroon        : '#800000',
		navy          : '#000080',
		olive         : '#808000',
		orange        : '#ffa500',
		purple        : '#800080',
		violet        : '#800080',
		silver        : '#c0c0c0',
	},
	
	random : function(){
		var result;
		var count = 0;
		_.each(this.names, function(color){
			if (Math.random() < 1/++count){
				result = color;
			}
		});
		return result;
	},
};


window.App = {
	Models     : {},
	Collections: {},
	Routers    : {},
	Views      : {},

	vent: _.extend({}, Backbone.Events),
	mainRouter: null,
	menuView  : null,

  start: function() {
		this.mainRouter = new App.Routers.MainRouter();
		this.menuView   = new App.Views.Menu();
		$('#menu').html(this.menuView.render().el);
		this.sseInit();
    return Backbone.history.start();
  },

  sseInit: function() {
    var _this = this;
    if (!!window.EventSource) {
      this.vent.source = new EventSource('/sse');
      this.vent.source.addEventListener('sse::connection', function(e) {
        return console.log(e);
      });
      this.vent.source.onmessage = function(event) {
        var data;
        data = JSON.parse(event.data);
        event = data.event;
        delete data.event;
        console.log(data);
        return _this.vent.trigger(event, data);
      };
      this.vent.source.onerror = function(event) {
        switch (event.target.readyState) {
          case EventSource.CONNECTING:
            break;
          case EventSource.CLOSED:
            console.log('Connection failed. Will not retry.');
            break;
        }
      };
    } else {
      return console.log('EventSource not supported.');
    }
  },
};

App.Models.ColorLed = Backbone.Model.extend({
	urlRoot: '/color_led',

	initialize: function(){
		this.fetch();
	},
});

App.Views.ColorLed = Backbone.View.extend({
	template: _.template($('#color_led-template').html()),

	initialize: function(){
		this.sendChange = _.throttle(this.sendChange, 500);
		this.listenTo(this.model, 'change', this.setSlider);
	},

	afterUpdate: function(){
		$('#alert').hide();
		$('#color').val($('[name=slider]').val());
	},

	events: {
		'submit form' : function(e){return e.preventDefault();},
		'change [name=slider]': 'sendColorChange'
	},

	render: function(){
		this.$el.html(this.template());
		this.afterUpdate();
		return this;
	},

	setSlider: function(){
		var color = this.model.get('colorLed');
		$('[name=slider]').val(color);
		$('#color').val(color);
		this.changePillColor();
	},

	changePillColor: function(){
		var color = $('[name=slider]').val();
		this.model.set('colorLed', color);
		$('#color').val(color);
		
		if (color <= 255){
			red = 255 - color;
			green = color;
			blue = 0;
		} else if (color <= 511){
			red = 0;
			green = 255 - (color - 256);
			blue = (color - 256);
		} else {
			red = (color - 512);
			green = 0;
			blue = 255 - (color - 512);
		}

		$('#color_value').css('background-color', 'rgb(' + red + ',' + green + ',' + blue + ')');
	},

	sendColorChange: function(){
		this.changePillColor();
		this.sendChange();
	},

	sendChange: function(){
		var data = {
			color: $('#color').val()
		};
		$.ajax({
			type: 'POST',
			url: '/color_led',
			data: data,
			success: function(){
				console.log('Success!');
			},
			error: function(){
				console.log('Error!');
			}
		});
	},
});

App.Views.WhiteButton = Backbone.View.extend({
	template: _.template($('#whiteButton-template').html()),

	initialize: function(){
		this.listenTo(App.vent, 'whiteButton', this.buttonState);
	},

	render: function(){
		$(this.el).html(this.template());
		return this;
	},

	buttonState: function(value){
		if (value.data === 0){
			this.$('span').removeClass('green').addClass('red');
			this.$('#led_state').val('OFF');
		} else {
			this.$('span').removeClass('red').addClass('green');
			this.$('#led_state').val('ON');
		}
	},
});

App.Views.Menu = Backbone.View.extend({
	template: _.template($('#menu-template').html()),

	initialize: function(){
		this.listenTo(App.mainRouter, 'route', this.selectButton);
	},

	render: function(){
		$(this.el).html(this.template());
		return this;
	},

	selectButton: function(){
		var url = Backbone.history.fragment;
		this.$('li').removeClass('pure-menu-selected');
		this.$('li a[href=#'+ url +']').parent().addClass('pure-menu-selected');
	},
});

App.Views.Home = Backbone.View.extend({
	template: _.template($('#home-template').html()),

	render: function(){
		$(this.el).html(this.template());
		return this;
	},
});

App.Views.Humidity = Backbone.View.extend({
	template: _.template($('#humidity-template').html()),
	chartOp: {},
	dataOp: {
		minutes: 5
	},
	dataDisplay: '#chart',

	events: {
		'click ul#chart-filter-time li a'    : 'updateFilterTimes',
		'click ul#data-format li a'          : 'toggleDataFormat',
		'submit #filter-data'                : 'filterData',
		'clik input[type=submit]'						 : 'filterData',
	},

	initialize: function(){
		this.listenTo(this.collection, 'sync', this.renderChart);
		this.fetchData(3);
	},

	render: function(){
		$(this.el).html(this.template());
		this.afterRender();
		return this;
	},

	afterRender: function(){
		this.$('#table').hide();
	},

	fetchData: function(hours){
		var begin = new Date().setHours(new Date().getHours() - hours);
		var end   = new Date().getTime();
		this.collection.fetch({
			data: {
				begin: begin,
				end: end
			},
			reset: true
		});
	},

	toggleDataFormat: function(e){
		var format = e.target.dataset.view;
		if (this.dataDisplay === format){
			return;
		}
		this.$(this.dataDisplay).hide();
		this.$(format).show();
		this.dataDisplay = format;
		this.updateTable();
		this.$('ul#data-format li').removeClass('pure-menu-selected');
		this.$('[data-view=' + format + ']').parent().addClass('pure-menu-selected');
	},

	updateTable: function(){
		if (this.dataDisplay !== '#table'){
			return;
		}
		this.$('tbody').empty();
		this.collection.forEach(function(hum, index){
			var date = new Date(hum.get('timestamp')).toLocaleDateString();
			var time = new Date(hum.get('timestamp')).toLocaleTimeString();
			var value = hum.get('humidity');
			this.$('tbody').append('<tr><td>'+index+'</td><td>'+date+'</td><td>'+time+'</td><td>'+value+'</td></tr>');
		});
	},

	updateFilterTimes: function(e){
		var hours = parseInt(e.target.dataset.hours);
		if (hours === 0){
			return;
		}
		this.$('ul#chart-filter-time li').removeClass('pure-menu-selected');
		this.$('[data-hours=' + hours + ']').parent().addClass('pure-menu-selected');
		this.fetchData(hours);
	},

	filterData: function(e){
		e.preventDefault();
		var from    = this.$('#from').val();
		var to      = this.$('#to').val();
		var between = this.$('#between').val();
		var and     = this.$('#and').val();
		var begin, end;
		if (from === '' || to === ''){
			return new Error('You must set the dates to filer.');
		}
		if (from <= to){
			if (between === ''){
				begin = new Date(from + ' ' + '00:00').getTime();
			} else {
				begin = new Date(from + ' ' + between).getTime();
			}
			if ( and === ''){
				end = new Date(to + ' ' + '23:59').getTime();
			} else {
				end = new Date(to + ' ' + and).getTime();
			}
		}
		this.collection.fetch({
			data: {
				begin: begin,
				end  : end
			},
			reset: true
		});
		this.$('ul#chart-filter-time li').removeClass('pure-menu-selected');
		this.$('[data-hours=0]').parent().addClass('pure-menu-selected');
	},

	renderChart: function(){
		var data         = {};
		this.updateTable();

		this.collection.forEach(function(hum){
			var humidity = hum.get('humidity');
			if(data[humidity] === undefined){
				data[humidity] = {
					value     : 1,
					color     : Colors.random(),
					label     : humidity,
					labelColor: 'white'
				};
			} else {
				if (data[humidity].value === undefined){
					data[humidity].value = 1;
				} else {
					data[humidity].value = data[humidity].value + 1;
				}
			}
		});
		console.log(data);
		var chartData = _.values(data);
		var ctx   = this.$('#hum-chart')[0].getContext('2d');
		var chart = new Chart(ctx).Pie(chartData, this.chartOp);
	},
});

App.Models.Humidity = Backbone.Model.extend({
	urlRoot: '/humidity',

	parse: function(response){
		var resp = JSON.parse(response);
		if (resp.temperature !== undefined){
			resp.temperature = parseFloat(resp.temperature);
		}
		return resp;
	},
});

App.Collections.Humidities = Backbone.Collection.extend({
	url: '/humidities',
	model: App.Models.Humidity,
});


App.Views.Temperature = Backbone.View.extend({
	template: _.template($('#temperature-template').html()),
	chartOp: {},
	dataOp: {
		minutes: 5
	},
	dataDisplay: '#chart',

	events: {
		'click ul#chart-minutes-average li a': 'updateChartOptions',
		'click ul#chart-filter-time li a'    : 'updateFilterTimes',
		'click ul#data-format li a'          : 'toggleDataFormat',
		'submit #filter-data'                : 'filterData',
		'clik input[type=submit]'						 : 'filterData',
	},

	initialize: function(){
		this.listenTo(this.collection, 'sync', this.renderChart);
		this.fetchData(3);
	},

	render: function(){
		$(this.el).html(this.template());
		this.afterRender();
		return this;
	},

	afterRender: function(){
		this.$('#table').hide();
	},

	fetchData: function(hours){
		var begin = new Date().setHours(new Date().getHours() - hours);
		var end   = new Date().getTime();
		this.collection.fetch({
			data: {
				begin: begin,
				end: end
			},
			reset: true
		});
	},

	toggleDataFormat: function(e){
		var format = e.target.dataset.view;
		if (this.dataDisplay === format){
			return;
		}
		this.$(this.dataDisplay).hide();
		this.$(format).show();
		this.dataDisplay = format;
		this.updateTable();
		this.$('ul#data-format li').removeClass('pure-menu-selected');
		this.$('[data-view=' + format + ']').parent().addClass('pure-menu-selected');
	},

	updateTable: function(){
		if (this.dataDisplay !== '#table'){
			return;
		}
		this.$('tbody').empty();
		this.collection.forEach(function(temp, index){
			var date = new Date(temp.get('timestamp')).toLocaleDateString();
			var time = new Date(temp.get('timestamp')).toLocaleTimeString();
			var value = temp.get('temperature');
			this.$('tbody').append('<tr><td>'+index+'</td><td>'+date+'</td><td>'+time+'</td><td>'+value+'</td></tr>');
		});
	},

	updateChartOptions: function(e){
		var minutes = parseInt(e.target.dataset.minutes);
		this.dataOp.minutes = minutes;
		this.$('ul#chart-minutes-average li').removeClass('pure-menu-selected');
		this.$('[data-minutes=' + minutes + ']').parent().addClass('pure-menu-selected');
		this.renderChart();
	},

	updateFilterTimes: function(e){
		var hours = parseInt(e.target.dataset.hours);
		if (hours === 0){
			return;
		}
		this.$('ul#chart-filter-time li').removeClass('pure-menu-selected');
		this.$('[data-hours=' + hours + ']').parent().addClass('pure-menu-selected');
		this.fetchData(hours);
	},

	filterData: function(e){
		e.preventDefault();
		var from    = this.$('#from').val();
		var to      = this.$('#to').val();
		var between = this.$('#between').val();
		var and     = this.$('#and').val();
		var begin, end;
		if (from === '' || to === ''){
			return new Error('You must set the dates to filer.');
		}
		if (from <= to){
			if (between === ''){
				begin = new Date(from + ' ' + '00:00').getTime();
			} else {
				begin = new Date(from + ' ' + between).getTime();
			}
			if ( and === ''){
				end = new Date(to + ' ' + '23:59').getTime();
			} else {
				end = new Date(to + ' ' + and).getTime();
			}
		}
		this.collection.fetch({
			data: {
				begin: begin,
				end  : end
			},
			reset: true
		});
		this.$('ul#chart-filter-time li').removeClass('pure-menu-selected');
		this.$('[data-hours=0]').parent().addClass('pure-menu-selected');
	},

	renderChart: function(){
		var labels       = [];
		var data         = [];
		var labelsBucket = [];
		var dataBucket   = [];
		var measurements = this.dataOp.minutes * 2;
		this.updateTable();
		this.collection.forEach(function(temp){
			labelsBucket.push(temp.get('timestamp'));
			dataBucket.push(temp.get('temperature'));
			if (labelsBucket.length === measurements){
				var avLabel = _.reduce(labelsBucket, function(memo, num){return memo + num;}) / measurements;
				var avTemp  = _.reduce(dataBucket, function(memo, num){return memo + num;}) / measurements;
				var date  = new Date(avLabel);
				labels.push(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
				data.push(avTemp);
				labelsBucket = [];
				dataBucket   = [];
			}
		});
		var chartData = {
			labels  : labels,
			datasets: [
				{
					fillColor       : 'rgba(220,220,220,0.5)',
					strokeColor     : 'rgba(220,220,220,1)',
					pointColor      : 'rgba(220,220,220,1)',
					pointStrokeColor: '#fff',
					data: data
				}
			]
		};
		var ctx   = this.$('#temp-chart')[0].getContext('2d');
		var chart = new Chart(ctx).Line(chartData, this.chartOp);
	},
});

App.Models.Temperature = Backbone.Model.extend({
	urlRoot: '/temperatures',

	parse: function(response){
		var resp = JSON.parse(response);
		if (resp.temperature !== undefined){
			resp.temperature = parseFloat(resp.temperature);
		}
		return resp;
	},
});

App.Collections.Temperatures = Backbone.Collection.extend({
	url: '/temperatures',
	model: App.Models.Temperature,
});

App.Views.LCD = Backbone.View.extend({
	template: _.template($('#lcd-template').html()),
	childViews: [],

	initialize: function(){
		this.model = new App.Models.Message();
		this.listenTo(App.vent, 'edit:message', this.edit);
		this.listenTo(this.collection, 'add', this.insertModelinTable);
		this.collection.fetch({}, {reset: true});
	},

	events: {
		'keyup textarea': 'updateCharCount',
		'submit form'     : 'saveMessage',
	},

	render: function(){
		$(this.el).html(this.template());
		this.afterRender();
		return this;
	},

	afterRender: function(){
		this.$('#edit').hide();
		this.$('.info').hide();
	},

	updateCharCount: function(){
		var length = this.$('textarea').val().length;
		if (length <= 32){
			this.$('span.chars').removeClass('error').text(' ' + length);
			this.$('textarea').removeClass('error');
		} else {
			this.$('span.chars').addClass('error').text(' ' + length);
			this.$('textarea').addClass('error');
		}
	},

	saveMessage: function(e){
		e.preventDefault();
		var self = this;
		message    = this.$('textarea').val();
		expiration = this.$('#expiration').val();
		if (message === ''){
			this.$('.info').html('<p class="alert">You must write a new message before \
														submitting the form</p>').fadeIn();
			this.timer = setTimeout(function(){
				$('.info').fadeOut('slow', function(){
					$('.info').empty();
				});
			}, 5000);
			this.$('textarea').focus();
			return;
		}
		if (this.$('textarea').val().length > 32){
			this.$('.info').html('<p class="alert">Messages should have less than \
														32 characters</p>').fadeIn();
			this.timer = setTimeout(function(){
				$('.info').fadeOut('slow', function(){
					$('.info').empty();
				});
			}, 5000);
			this.$('textarea').focus();
			return;
		}
		if (expiration === '' || _.isNumber(parseInt(expiration)) === false){
			expiration = 0;
		} else {
			expiration = parseInt(expiration);
		}
		this.$('textarea').val('');
		this.$('#expiration').val('');
		this.$('span.chars').text(' 0');
		attr = {
			timestamp : new Date().getTime(),
			message   : message,
			expiration: expiration
		};
		this.model.save(attr, {success: function(model){
			self.collection.add(model);
		}});
		//this.insertModelinTable(this.model);
		this.model = new App.Models.Message();
		this.$('#edit').hide();
		this.$('#save').show();
		this.$('textarea').focus();
	},

	insertModelinTable: function(model){
		view = new App.Views.MessageRow({model: model});
		this.$('table').append(view.render().el);
		this.childViews.push(view);
	},

	edit: function(cid){
		this.model = this.collection.remove(cid);
		this.$('textarea').val(this.model.get('message'));
		this.$('#expiration').val(this.model.get('expiration'));
		this.$('#edit').show();
		this.$('#save').hide();
	},

	close: function(){
		_.each(this.childViews, function(view){
			view.remove();
		});
		if (this.timer){
			clearTimeout(this.timer);
		}
		this.remove();
	},
});

App.Views.MessageRow = Backbone.View.extend({
	tagName: 'tr',

	initialize: function(){
		this.listenTo(App.vent, 'message:expiration:decrese', this.changeExpiration);
	},

	events: {
		'click #edit'  : 'edit',
		'click #delete': 'delete',
	},

	render: function(){
		$(this.el).html(
			'<td>' + this.model.get('message') + '</td>' +
			'<td>' + this.model.get('expiration') + '</td>' +
			'<td><a id="edit"><em>edit</em></a></td>' +
			'<td><a id="delete"><em>delete</em></a></td>'
		);
		return this;
	},

	changeExpiration: function(sse){
		if (this.model.id === sse.data){
			var exp = this.model.get('expiration');
			this.model.set('expiration', exp - 1);
			this.render();
		}
	},

	edit: function(e){
		e.preventDefault();
		App.vent.trigger('edit:message', this.model.cid);
		this.remove();
	},

	delete: function(e){
		e.preventDefault();
		this.model.destroy();
		this.remove();
	},
});

App.Models.Message = Backbone.Model.extend({
	urlRoot: '/messages',

	parse: function(response){
		if (_.isObject(response)){
			return response;
		}
		var resp = JSON.parse(response);
		return resp;
	},
});

App.Collections.Messages = Backbone.Collection.extend({
	url: '/messages',
	model: App.Models.Message,
});

App.Views.Servo = Backbone.View.extend({
	template: _.template($('#servo-template').html()),

	events: {
		'submit form' : function(e){return e.preventDefault();},
		'change [name=slider]': 'changeSlider'
	},

	initialize: function(){
		this.changeSlider = _.throttle(this.changeSlider, 100);
		this.listenTo(this.model, 'change', this.setSlider);
	},

	afterUpdate: function(){
		$('#alert').hide();
		$('#color').val($('[name=slider]').val());
	},

	render: function(){
		this.$el.html(this.template());
		this.afterUpdate();
		return this;
	},

	setSlider: function(){
		var degrees = this.model.get('degrees');
		$('[name=slider]').val(degrees);
		$('#degrees').val(degrees);
	},

	changeSlider: function(){
		var degrees = $('[name=slider]').val();
		this.model.set('degrees', degrees);
		this.sendChange();
	},

	sendChange: function(){
		$.ajax({
			type: 'POST',
			url: '/servo',
			data: this.model.attributes,
			success: function(){
				console.log('Success!');
			},
			error: function(){
				console.log('Error!');
			}
		});
	},
});

App.Models.Servo = Backbone.Model.extend({
	urlRoot: '/servo',

	initialize: function(){
		this.fetch();
	},
});

App.Routers.MainRouter = Backbone.Router.extend({
	currentView : null,
	temperatures: new App.Collections.Temperatures(),
	humidities  : new App.Collections.Humidities(),

	routes: {
		''            : 'home',
		'home'        : 'home',
		'color_led'   : 'colorLed',
		'white_button': 'whiteButton',
		'temperature' : 'temperature',
		'humidity'		: 'humidity',
		'lcd'					: 'lcd',
		'servo'				: 'servo'
	},

	swapView: function(view){
		if (this.currentView !== null){
			if (typeof(this.currentView.close) === 'function'){
				this.currentView.close();
			} else {
				this.currentView.remove();
			}
		}
		this.currentView = view;
		$('#main').html(view.render().el);
	},

	home: function(){
		this.swapView(new App.Views.Home());
	},

	colorLed: function(){
		this.swapView(new App.Views.ColorLed({model: new App.Models.ColorLed()}));
	},

	whiteButton: function(){
		this.swapView(new App.Views.WhiteButton());
	},

	temperature: function(){
		this.swapView(new App.Views.Temperature({collection: this.temperatures}));
	},

	humidity: function(){
		this.swapView(new App.Views.Humidity({collection: this.humidities}));
	},

	lcd: function(){
		this.swapView(new App.Views.LCD({collection: new App.Collections.Messages()}));
	},

	servo: function(){
		this.swapView(new App.Views.Servo({model: new App.Models.Servo()}));
	},
});

// *************  APP START ********************//

$(document).ready(function() {
  return App.start();
});