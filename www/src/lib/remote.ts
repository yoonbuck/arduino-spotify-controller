import SerialPort from "../vendor/p5.serialport";

const REMOTE_BUTTON_TIMEOUT = 200;

export default class RemoteThrottler {
  #lastReceivedTime = new Array<number>(256);
  #throttleDuration = new Array<number>(256);
  #listeners = new Array<(time: number) => void>(256);
  #defaultTimeout: number;
  #debug: boolean;

  constructor(defaultTimeout = REMOTE_BUTTON_TIMEOUT, debug = false) {
    this.#lastReceivedTime.fill(0);
    this.#defaultTimeout = defaultTimeout;
    this.#debug = debug;
  }

  on(
    command: number,
    callback: (time: number) => void,
    throttleDuration = this.#defaultTimeout
  ) {
    this.#listeners[command] = callback;
    this.#throttleDuration[command] = throttleDuration;
  }

  dispatch(command: number, time: number) {
    if (
      time - this.#lastReceivedTime[command] >
      this.#throttleDuration[command]
    ) {
      if (this.#debug) {
        console.debug("[remote] DISPATCH", command.toString(16));
      }
      this.#lastReceivedTime[command] = time;
      this.#listeners[command]?.(time);
    }
    if (this.#debug) {
      console.debug("[remote] receive:", command.toString(16));
    }
  }
}
