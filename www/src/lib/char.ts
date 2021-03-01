export const UNK = charCode("?");
export const SPACE = charCode(" ");
export const GLYPH_PLAY = 0;
export const GLYPH_PAUSE = 1;
export const GLYPH_SPEAKER = 2;
export const GLYPH_VOLUME_LOW = 3;
export const GLYPH_VOLUME_HIGH = 4;
export const GLYPH_BAR = 5;
export const GLYPH_THUMB = 6;
export const GLYPH_NOTE = 7;

export function charCode(char: string): number {
  return char.charCodeAt(0);
}

export function safeCharCode(char: string): number {
  let code = char.charCodeAt(0);
  if (code > 0x7f) {
    return UNK;
  } else {
    return code;
  }
}

export function safeCharAt(str: string, index: number): number {
  if (index < 0 || index >= str.length) {
    return SPACE;
  } else {
    return safeCharCode(str.charAt(index));
  }
}
