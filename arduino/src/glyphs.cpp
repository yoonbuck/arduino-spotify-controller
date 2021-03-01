#include <Arduino.h>

const byte glyph_null[] PROGMEM = { 0, 0, 0, 0, 0, 0, 0, 0 };

const byte glyph_play[] PROGMEM = {
  0b10000,
  0b11000,
  0b11100,
  0b11110,
  0b11100,
  0b11000,
  0b10000,
  0b00000,
};

const byte glyph_pause[] PROGMEM = {
  0b11011,
  0b11011,
  0b11011,
  0b11011,
  0b11011,
  0b11011,
  0b11011,
  0b00000,
};

const byte glyph_note[] PROGMEM = {
  0b00010,
  0b00011,
  0b00010,
  0b00010,
  0b01110,
  0b11110,
  0b11110,
  0b01100,
};

const byte glyph_speaker[] PROGMEM = {
  0b00001,
  0b00011,
  0b11111,
  0b11111,
  0b11111,
  0b00011,
  0b00001,
  0b00000,
};
const byte glyph_volume_low[] PROGMEM = {
  0b00000,
  0b10000,
  0b01000,
  0b01000,
  0b01000,
  0b10000,
  0b00000,
  0b00000,
};
const byte glyph_volume_high[] PROGMEM = {
  0b00100,
  0b10010,
  0b01010,
  0b01010,
  0b01010,
  0b10010,
  0b00100,
  0b00000,
};

const byte glyph_bar[] PROGMEM = {
  0b00000,
  0b00000,
  0b00000,
  0b10101,
  0b10101,
  0b00000,
  0b00000,
  0b00000,
};
const byte glyph_thumb[] PROGMEM = {
  0b00000,
  0b01110,
  0b11111,
  0b11111,
  0b11111,
  0b11111,
  0b01110,
  0b00000,
};

const byte* const glyphs_table[] PROGMEM = {
  glyph_play,
  glyph_pause,
  glyph_speaker,
  glyph_volume_low,
  glyph_volume_high,
  glyph_bar,
  glyph_thumb,
  glyph_note,
};