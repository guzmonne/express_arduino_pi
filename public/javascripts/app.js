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
    return Backbone.history.start();
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
		''         : 'home',
		'home'     : 'home',
		'color_led': 'colorLed'
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
});

// *************  APP START ********************//

$(document).ready(function() {
  return App.start();
});