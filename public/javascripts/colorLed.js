$(document).ready(function(){
	$('#alert').hide();
	$('#color').val($('[name=slider]').val());

	function changeColor() {
		var data = {
			color: $('#color').val()
		};
		$.ajax({
			type: "POST",
			url: "/color_led",
			data: data,
			success: function(response){
    		console.log("Success!");
      	console.log(response);
			},
			error: function(response){
    		console.log("Error!");
      	console.log(response);
			}
		});
	}

	$('form').submit(function(e){
		e.preventDefault();
		//changeColor();
	});


	var red, blue, green;
	$('[name=slider]').change(function(e){
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
			green = 0
			blue = 255 - (color - 512);
		}

		$('#color_value').css('background-color', 'rgb(' + red + ',' + green + ',' + blue + ')');

		changeColor();
	});
});