/*
* The circuit:
* LED atached from pin 3 to ground
* Button attached to pin 2 from +5V
* 10K resistor atached to pin 2 from ground
* Button Control An LED
*/

#include "DHT.h"

#define DHTPIN A0 // What pin we're connected to
#define DHTTYPE DHT11

const unsigned long readInterval = 30000;

int button         = 2; // The Grove port No. you attached a button to
int LED            = 3; // The Grove port No. you atached the LED to
int preButtonState = 0;
unsigned long time = 0;

DHT dht(DHTPIN, DHTTYPE);

void setup(){
	pinMode(button, INPUT); // Set button as an INPUT device
	pinMode(LED, OUTPUT); // Set LED as an OUTPUT device

	// Initiate serial connection
	Serial.begin(9600);
	dht.begin();
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