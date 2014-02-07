/*
* The circuit:
* LED atached from pin 3 to ground
* Button attached to pin 2 from +5V
* 10K resistor atached to pin 2 from ground
* Button Control An LED
*/

int button         = 2; // The Grove port No. you attached a button to
int LED            = 3; // The Grove port No. you atached the LED to
int preButtonState = 0;

void setup(){
	pinMode(button, INPUT); // Set button as an INPUT device
	pinMode(LED, OUTPUT); // Set LED as an OUTPUT device

	// Initiate serial connection
	Serial.begin(9600);
}

void loop(){
	int buttonState = digitalRead(button); // read the status of the button
	if (buttonState == 1){
		digitalWrite(LED, 1); // Turn on the RED
		if (preButtonState == 0){
			Serial.println("whiteButton:1");
			preButtonState = 1;
		}
	} else {
		digitalWrite(LED, 0);
		if (preButtonState == 1){
			Serial.println("whiteButton:0");
			preButtonState = 0;
		}
	}
}