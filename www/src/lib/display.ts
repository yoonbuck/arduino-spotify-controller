import SerialPort from "../vendor/p5.serialport";
import {
  GLYPH_BAR,
  GLYPH_NOTE,
  GLYPH_PAUSE,
  GLYPH_PLAY,
  GLYPH_SPEAKER,
  GLYPH_THUMB,
  GLYPH_VOLUME_HIGH,
  GLYPH_VOLUME_LOW,
  safeCharAt,
  SPACE,
} from "./char";

/**
 * Maximum number of times updates should be pushed to the display
 */
const UPDATE_FREQ = 10;

/**
 * Minimum time to display contextual information screens before switching back
 */
const DEFAULT_TIMEOUT = 4000;

/**
 * Write safe data from a string into a display buffer
 * @param buf buffer into which data will be written
 * @param str string to copy into buffer
 * @param start where to insert the string into the buffer
 * @param length number of characters to copy (by default, the entire str).
 *        if greater than the string length, spaces will be added instead.
 */
function writeString(
  buf: Uint8Array,
  str: string,
  start: number = 0,
  length?: number
) {
  length = length ?? str.length;
  for (let i = 0; i < length; i++) {
    buf[start + i] = safeCharAt(str, i);
  }
}

/**
 * two digit zero-padded time
 */
function padTime(value: number): string {
  return ("0" + value).substr(-2);
}

/**
 * format a time string in m:ss format
 * @param time value to format (ms)
 */
function formatTime(time: number): string {
  let totalSecs = Math.round(time / 1000);
  let mins = Math.floor(totalSecs / 60);
  let secs = totalSecs % 60;
  return `${mins}:${padTime(secs)}`;
}

/**
 * Controller for a 16x2 LCD display.
 * Also keeps track of spotify player state
 */
export default class DisplayController {
  songName: string;
  volume: number = 0;
  playing: boolean = false;
  duration: number;
  position: number;
  serial: SerialPort;
  hasStatus: boolean = false;

  #buf1 = new Uint8Array(16);
  #buf2 = new Uint8Array(16);

  #volumeTimeout = new TimeoutTimer();
  #positionTimeout = new TimeoutTimer();

  #flushTimeout = new TimeoutTimer(Math.ceil(1000 / UPDATE_FREQ));

  lastUpdate: number = -1;

  /**
   * Creates a new DisplayController
   * @param serial SerialPort to which display data should be written
   */
  constructor(serial: SerialPort) {
    this.serial = serial;
    this.#buf1.fill(" ".charCodeAt(0));
  }

  /**
   * Display the volume level temporarily
   */
  showVolume() {
    this.#volumeTimeout.reset();
  }

  /**
   * Display the numeric position and duration temporarily
   */
  showPosition() {
    this.#positionTimeout.reset();
  }

  /**
   * step the display controller forward in time - should be called once per
   * cycle as appropriate. updates the display and sends display data over serial.
   * @param deltaTime amount of time (ms) since the last tic, per P3's deltaTime
   * @param currentTime current absolute time (ms), per P3's millis()
   */
  tic(deltaTime: number, currentTime: number) {
    this.#volumeTimeout.tic(deltaTime);
    this.#positionTimeout.tic(deltaTime);
    this.#flushTimeout.tic(deltaTime);

    if (this.hasStatus && this.playing) {
      this.position += currentTime - this.lastUpdate;
      this.position = Math.min(this.position, this.duration);
      this.lastUpdate = currentTime;
    }

    this.construct();
    if (!this.#flushTimeout.active) {
      this.#flushTimeout.reset();
      this.flush();
    }
  }

  /**
   * Rebuild, but do not send the display contents.
   */
  construct() {
    if (!this.hasStatus) {
      this.#buf1[0] = GLYPH_NOTE;
      writeString(this.#buf1, " Play a song", 1, 15);
      this.#buf2.fill(GLYPH_BAR);
      return;
    }

    if (this.#positionTimeout.active) {
      // show position
      writeString(
        this.#buf1,
        `${formatTime(this.position)} / ${formatTime(this.duration)}`,
        0,
        16
      );
    } else {
      // show track name
      this.#buf1[0] = this.playing ? GLYPH_PLAY : GLYPH_PAUSE;
      this.#buf1[1] = SPACE;
      writeString(this.#buf1, this.songName, 2, 14);
    }

    if (this.#volumeTimeout.active) {
      // show volume
      this.#buf2.fill(GLYPH_BAR);
      this.#buf2[0] = GLYPH_SPEAKER;
      if (this.volume === 0) {
        this.#buf2[1] = SPACE;
      } else if (this.volume < 50) {
        this.#buf2[1] = GLYPH_VOLUME_LOW;
      } else {
        this.#buf2[1] = GLYPH_VOLUME_HIGH;
      }
      let posidx = Math.floor((this.volume / 100) * 13);
      this.#buf2[posidx + 2] = GLYPH_THUMB;
    } else {
      // show position
      let posidx = Math.min(
        15,
        Math.floor((this.position / this.duration) * 16)
      );
      this.#buf2.fill(GLYPH_BAR);
      this.#buf2[posidx] = GLYPH_THUMB;
    }
  }

  /**
   * Send the display contents via Serial to the display.
   */
  flush() {
    if (!this.serial.isConnected) return;
    this.serial.write(Array.from(this.#buf1));
    this.serial.write(Array.from(this.#buf2));
    this.serial.write(0xff);
  }
}

/**
 * Keeps track of a timeout/countdown.
 */
class TimeoutTimer {
  time: number = 0;
  duration: number;

  /**
   * Creates a new TimeoutTimer with the given duration
   * @param duration timeout duration, or DEFAULT_TIMEOUT by default
   */
  constructor(duration: number = DEFAULT_TIMEOUT) {
    this.duration = duration;
  }

  /**
   * Update the TimeoutTimer
   * @param delta amount of time passed since the last call to tic()
   */
  tic(delta: number) {
    if (this.time > 0) {
      this.time -= delta;
      if (this.time < 0) this.time = 0;
    }
  }

  /**
   * Cancel the timeout if active.
   */
  cancel() {
    this.time = 0;
  }

  /**
   * Start a new timeout for the full duration
   */
  reset() {
    this.time = this.duration;
  }

  /**
   * Whether or not the TimeoutTime is active (i.e., currently counting down)
   */
  get active() {
    return this.time > 0;
  }
}
