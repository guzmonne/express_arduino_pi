/************************************
	LCD PINS
	========
  1 to GND
  2 to 5V
  3 to the center pin on the potentiometer
  4 to Arduino digital pin 12
  5 to GND
  6 to Arduino digital pin 6
  7 (no connection)
  8 (no connection)
  9 (no connection)
  10 (no connection)
  11 to Arduino digital pin 5
  12 to Arduino digital pin 4
  13 to Arduino digital pin 3
  14 to Arduino digital pin 2
  15 to 5V
  16 to GND
************************************/

// LCD Library Initialize
// ====================== 
# include <LiquidCrystal.h>
// Load the pins
// -------------
LiquidCrystal lcd(12,6,5,4,3,2);

// Constants
// =========
const int SERIAL_PIN = 13;
const int RED_PIN    = 9;
const int GREEN_PIN  = 10;
const int BLUE_PIN   = 11;

// Variables
// =========
String inputString     = "";
String message1         = "Hello,";
String message2					= "World!";
boolean toggleComplete = false;
boolean newColor       = false;
boolean newMessage     = false;
int byteCount					 = 0;
int color;
int incomingByte;

void setup()
{
	// Initialize a LCD of two lines and 16 characters
	lcd.begin(16, 2);
	// Clear the screen
	lcd.clear();
	// Print basic hello message
	lcd.setCursor(0,0);
	lcd.print(message1);
	lcd.setCursor(0,1);
	lcd.print(message2);

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
	// Set cursor at the second line of the LCD and print the 
	// seconds since the Arduino was turned on.
	// lcd.setCursor(0, 1);      // Set the cursor on the begining of the second row
	// lcd.print("       ");     // Erase the biggest number we can display
	// lcd.setCursor(0, 1);      // Reset the cursor to the beggining of the line
	// lcd.print(millis()/1000); // Print the seconds

	while (Serial.available() && toggleComplete == false){
		char inChar = (char)Serial.read();

		// Receiving new message
		if (inChar == 0x5B){
			message1   = "";
			message2   = "";
			newMessage = true;
			byteCount  = 0; 
			//Serial.println("New Message start");
		} else if (inChar == 0x5D){
			toggleComplete = true;
			//Serial.println();
			//Serial.println("New Message end");
		// Receiving new number
		} else if (inChar == 0x7B){ // Starts communication
			inputString = "";
			newColor = true;
			//Serial.println("Number start");
		} else if (inChar == 0x7D){ // Ends communication
			toggleComplete = true;
			//Serial.println();
			//Serial.println("Number End");
		} else {
		// Saving data
			if (newMessage == true){
				if (byteCount < 16){
					message1 += inChar;
				} else {
					message2 += inChar;
				}
				byteCount++;
			} else if (newColor == true){
				inputString += inChar;
			}
			//Serial.print(inChar);
		}
	}

	if (toggleComplete == true){
		if (newColor == true){
			// Convert String to Int
			int recievedVal = stringToInt();
			color = recievedVal;
			Serial.print("The LED color is now: ");
			Serial.println(recievedVal);
		}
		if (newMessage == true){
			printLCD();
		}
		newColor       = false;
		newMessage     = false;
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

void printLCD(){
	lcd.clear();
	lcd.setCursor(0,0);
	lcd.print(message1);
	lcd.setCursor(0,1);
	lcd.print(message2);
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
