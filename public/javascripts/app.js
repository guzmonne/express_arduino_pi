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
      this.vent.source = new EventSource("/sse");
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
      return this.vent.source.onerror = function(event) {
        switch (event.target.readyState) {
          case EventSource.CONNECTING:
            break;
          case EventSource.CLOSED:
            console.log("Connection failed. Will not retry.");
            break;
        }
      };
    } else {
      return console.log("EventSource not supported.");
    }
  },
};

App.Views.ColorLed = Backbone.View.extend({
	template: _.template($('#color_led-template').html()),

	initialize: function(){
		this.sendChange = _.throttle(this.sendChange, 500);
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

	changePillColor: function(){
		var color = $('[name=slider]').val();
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
		this.listenTo(App.vent, "whiteButton", this.buttonState);
	},

	render: function(){
		$(this.el).html(this.template());
		return this;
	},

	buttonState: function(value){
		if (value.data === 0){
			this.$('span').removeClass('green').addClass('red');
			this.$('#led_state').val("OFF");
		} else {
			this.$('span').removeClass('red').addClass('green');
			this.$('#led_state').val("ON");
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


App.Routers.MainRouter = Backbone.Router.extend({
	currentView: null,

	routes: {
		''            : 'home',
		'home'        : 'home',
		'color_led'   : 'colorLed',
		'white_button': 'whiteButton'
	},

	swapView: function(view){
		if (this.currentView !== null){
			this.currentView.remove();
		}
		this.currentView = view;
		$('#main').html(view.render().el);
	},

	home: function(){
		this.swapView(new App.Views.Home());
	},

	colorLed: function(){
		this.swapView(new App.Views.ColorLed());
	},

	whiteButton: function(){
		this.swapView(new App.Views.WhiteButton());
	},
});

// *************  APP START ********************//

$(document).ready(function() {
  return App.start();
});