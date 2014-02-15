/*
* The circuit:
* LED atached from pin 3 to ground
* Button attached to pin 2 from +5V
* 10K resistor atached to pin 2 from ground
* Button Control An LED
*/

#include "DHT.h"   // Groove Shield Library
#include <Servo.h> // Arduino default servo library

#define DHTPIN A0 // What pin we're connected to
#define DHTTYPE DHT11

const unsigned long readInterval = 30000;
int button             = 2; 
int LED                = 3; 
int degrees;
int preButtonState     = 0;
unsigned long time     = 0;
String inputString     = "";
boolean servoTest      = false;
boolean toggleComplete = false;
int incomingByte;


Servo servo1;  // servo control object
DHT dht(DHTPIN, DHTTYPE);

void setup(){
	// Initialize LED configuration
	pinMode(button, INPUT); // Set button as an INPUT device
	pinMode(LED, OUTPUT); 	// Set LED as an OUTPUT device

	// Initiate serial connection
	Serial.begin(9600);
	dht.begin();

	// Initialize servo communications
	servo1.attach(11);
	degrees = 0;
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

	// ****************
	// Servo
	while (Serial.available() && toggleComplete == false){
		char inChar = (char)Serial.read();
		// Receiving new message
		if (inChar == 0x7B){ // Starts communication
			inputString = "";
		} else if (inChar == 0x7D){ // Ends communication
			toggleComplete = true;
		} else { // Saving data
			inputString += inChar;
		}
	}

	if (toggleComplete == true){
		int recievedVal = stringToInt();
		degrees = recievedVal;
		toggleComplete = false;
		Serial.print("The servo value is now: ");
		Serial.println(recievedVal);
	}

	servo1.write(degrees);
	// **************

	// Reading temperature or humidity takes about 250 miliseconds!
	// Sensor readings may also be up to A0 seconds 'old' (very slow sensor)
	if ((millis() - time) > readInterval){
		time = millis();
		float h = dht.readHumidity();
		float t = dht.readTemperature();
		// Check if returns are valid, if they are NaN (not a number) then something went wrong!
		if (isnan(t) || isnan(h)){
			Serial.println("error:Failed to read from DHT");
		} else {
			Serial.print("humidity:");
			Serial.println(h);
			Serial.print("temperature:");
			Serial.println(t);
		}
	}
}

int stringToInt(){
	int inputStringLength = inputString.length() + 1;
	char charHolder[inputStringLength];
	inputString.toCharArray(charHolder, inputStringLength);
	int _recievedVal = atoi(charHolder);
	return _recievedVal;
}