#include <Arduino.h>

void setup();
void loop();
int stringToInt();
void showRGB(int color);
#line 1 "src/sketch.ino"
// Constants
// =========
const int SERIAL_PIN = 13;
const int RED_PIN    = 9;
const int GREEN_PIN  = 10;
const int BLUE_PIN   = 11;

// Variables
// =========
String inputString 			= "";
boolean toggleComplete = false;
int color;
int incomingByte;

void setup()
{
	// Set default color
	color = 500;

	// Initiate serial connection
	Serial.begin(9600);

	// Initiate Pin Connections 
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  pinMode(SERIAL_PIN, OUTPUT);
}


void loop(){
	while (Serial.available() && toggleComplete == false){
		char inChar = (char)Serial.read();
		//Serial.print("We have recieved: ");
		//Serial.println(inChar, HEX);

		if (inChar == 0x7B){ // Starts communication
			inputString = "";
			Serial.println("String start");
		} else if (inChar == 0x7D){ // Ends communication
			toggleComplete = true;
			Serial.println("String End");
		} else {
			inputString += inChar;
			Serial.print("We have recieved: ");
			Serial.println(inChar, HEX);
		}
	}

	if (toggleComplete == true){
		// Convert String to Int
		int recievedVal = stringToInt();
		color = recievedVal;
		Serial.print("The LED color is now: ");
		Serial.println(recievedVal);
		toggleComplete = false;
	}

	showRGB(color);
	delay(50);
}

int stringToInt(){
	int inputStringLength = inputString.length() + 1;
	char charHolder[inputStringLength];
	inputString.toCharArray(charHolder, inputStringLength);
	int _recievedVal = atoi(charHolder);
	return _recievedVal;
}

void showRGB(int color)
{
  int redIntensity;
  int greenIntensity;
  int blueIntensity;

  if (color <= 255)          // zone 1
  {
    redIntensity = 255 - color;    // red goes from on to off
    greenIntensity = color;        // green goes from off to on
    blueIntensity = 0;             // blue is always off
  }
  else if (color <= 511)     // zone 2
  {
    redIntensity = 0;                     // red is always off
    greenIntensity = 255 - (color - 256); // green on to off
    blueIntensity = (color - 256);        // blue off to on
  }
  else // color >= 512       // zone 3
  {
    redIntensity = (color - 512);         // red off to on
    greenIntensity = 0;                   // green is always off
    blueIntensity = 255 - (color - 512);  // blue on to off
  }

  // Now that the brightness values have been set, command the LED
  // to those values

  analogWrite(RED_PIN, redIntensity);
  analogWrite(BLUE_PIN, blueIntensity);
  analogWrite(GREEN_PIN, greenIntensity);
}
