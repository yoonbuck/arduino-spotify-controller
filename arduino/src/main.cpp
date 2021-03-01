#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal.h>
#include <IRremote.h>

#include "./glyphs.cpp"

// create the lcd display controller object
LiquidCrystal lcd(12, 11, 4, 5, 6, 7);

// splash screens
const char splash1[] PROGMEM = "\7 \7  please  \7 \7";
const char splash2[] PROGMEM = " \7 connect me \7 ";

// write a string stored in program memory to the lcd
void printmem(const char* str, byte len = 16) {
  // loop over the appropriate length
  for (byte i = 0; i < len; i++) {
    // and write each character
    lcd.write(pgm_read_byte(&str[i]));
  }
}

// write a string stored in... idk. not program memory.
void printstr(const char* str, byte len = 16) {
  // loop over the appropriate length
  for (byte i = 0; i < len; i++) {
    // and write each character
    lcd.write(str[i]);
  }
}

// runs once at start
void setup() {
  // begin the lcd or something
  lcd.begin(16, 2);
  // tell it not to scroll automatically
  // I think this is the default? but sometimes
  // it does anyway. this probably doesn't help.
  lcd.noAutoscroll();
  // listen for ir remote commands on pin 8
  IrReceiver.begin(8, false);
  // initialize the serial port
  Serial.begin(57600);
  // set a reasonable-ish timeout
  // (we later use 0xFF to synchronize serial data)
  Serial.setTimeout(250);

  // program custom glyphs into lcd
  for (byte i = 0; i < 8; i++) {
    // for each byte in the glyph table (see glyphs.cpp), program that
    // as a custom glyph
    lcd.createChar(i, (const char*) pgm_read_byte(&glyphs_table[i]));
  }

  // move to the first line
  lcd.setCursor(0, 0);
  // print the splash screen
  printmem(splash1);
  // move to the second line
  lcd.setCursor(0, 1);
  // print the splash screen
  printmem(splash2);

  // wait a second, just so everything gets a chance to settle?
  // idk. this helped with the serial stuff.
  delay(1000);
}

// send a ir command over the serial port
void sendCommand(byte command) {
  Serial.print(F("{\"type\":\"ircommand\",\"command\":"));
  Serial.print(command);
  Serial.print(F(",\"time\":"));
  Serial.print(millis());
  Serial.println('}');
}

// buffer for display data
char buf[33];

// run forever and ever!
void loop() {
  // got anything from the remote?
  if (IrReceiver.decode()) {
    // read the command
    byte cmd = IrReceiver.decodedIRData.command;
    // and send it over the serial port
    sendCommand(cmd);
    // resume listening for another command
    IrReceiver.resume();
  }
  // if there's data ready from the serial port
  if (Serial.available()) {
    // put it in the buffer, stopping at 33 bytes or 0xFF
    int bytes_read = Serial.readBytesUntil(0xFF, &buf[0], 33);

    // if we got all 32 bytes (plus the stop character)
    if (bytes_read == 33) {
      // dump it all to the screen
      lcd.setCursor(0, 0); // line 1
      printstr(&buf[0]);   // print to line 1
      lcd.setCursor(0, 1); // line 2
      printstr(&buf[16]);  // print to line 2
    } else {
      // otherwise, print an error to the serial port
      Serial.print(F("{\"type\":\"debug\",\"message\":\"expected 33; got only "));
      Serial.print(bytes_read);
      Serial.println(F(" bytes of data\"}"));
    }
  }
}