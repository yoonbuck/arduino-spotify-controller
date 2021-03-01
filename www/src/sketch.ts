import type P5 from "p5";
import DisplayController from "./lib/display";
import RemoteThrottler from "./lib/remote";
import {
  getStatus,
  pause,
  play,
  setPosition,
  setVolume,
  skipNext,
  skipPrevious,
} from "./lib/spotify";
import SerialPort from "./vendor/p5.serialport";

/**
 * How often to fetch player status from spotify
 */
const REFRESH_FREQ = 1000;

/**
 * amount volume +/- buttons adjust volume by
 */
const VOLUME_BUMP = 8;

/**
 * amount time jumps adjust position by (ms)
 */
const POSITION_BUMP = 5 * 1000;

export default function (s: P5) {
  /** serial port object (from p3.serialport) */
  let serial: SerialPort;

  /** display controller */
  let display: DisplayController;
  /** remote button press throttler */
  let remote: RemoteThrottler;

  /**
   * hook used to cancel the current update
   * (not sure if this actually works)
   */
  let cancelUpdate: () => void;

  // setup function (runs once)
  s.setup = () => {
    // create and open the serial port
    serial = new SerialPort();
    serial.open("/dev/tty.usbmodem14101", { baudRate: 57600 });
    // add event handlers for data and open
    serial.on("data", serialRecv);
    serial.on("open", ready);
    // create the display controller
    display = new DisplayController(serial);
    // create the remote throttler
    remote = new RemoteThrottler();

    // add event listeners for appropriate remote buttons
    remote.on(0x46, volumeUp, 150); // vol+
    remote.on(0x15, volumeDown, 150); // vol-
    remote.on(0x44, previous, 500); // prev
    remote.on(0x43, next, 500); // next
    remote.on(0x40, playPause, 500); // play
    remote.on(0x09, jumpForward, 150); // arrow up
    remote.on(0x07, jumpBackward, 150); // arrow down

    // trigger the first update from spotify
    update();
  };

  /** callback on ready */
  function ready() {
    // update status indicator on the page
    document.getElementById("status").textContent = "Connected.";
  }

  /** callback for volume up */
  async function volumeUp() {
    // show volume on display
    display.showVolume();
    // update value
    display.volume = Math.min(100, display.volume + VOLUME_BUMP);
    // cancel update
    cancelUpdate?.();
    // ask spotify to change the volume
    await setVolume(display.volume);
    // trigger another update later
    createUpdate(200);
  }

  /** callback for volume down */
  async function volumeDown() {
    // show volume on display
    display.showVolume();
    // update value
    display.volume = Math.max(0, display.volume - VOLUME_BUMP);
    // cancel update
    cancelUpdate?.();
    // ask spotify to set the volume
    await setVolume(display.volume);
    // trigger another update later
    createUpdate(200);
  }

  /** callback for skip to previous */
  async function previous() {
    // cancel update
    cancelUpdate?.();
    // ask spotify to skip to previous
    await skipPrevious();
    // trigger another update later
    createUpdate(100);
  }

  /** callback for skip to next */
  async function next() {
    // cancel update
    cancelUpdate?.();
    // ask spotify to skip to next
    await skipNext();
    // trigger another update later
    createUpdate(100);
  }

  /** callback for play/pause */
  async function playPause() {
    // cancel update
    cancelUpdate?.();
    // flip stored playing value
    display.playing = !display.playing;
    // based on whether we are now playing or not
    if (display.playing) {
      // ask spotify to play
      await play();
    } else {
      // or ask spotify to pause
      await pause();
    }
    // and then update later
    createUpdate(100);
  }

  /** callback for jump backward */
  async function jumpBackward() {
    // show position on display
    display.showPosition();
    // set new position
    display.position = Math.floor(
      Math.max(0, display.position - POSITION_BUMP)
    );
    // update display's last update time
    display.lastUpdate = s.millis();
    // cancel update
    cancelUpdate?.();
    // ask spotify to set position
    await setPosition(display.position);
    // trigger another update later
    createUpdate(500);
  }

  /** callback for jump forward */
  async function jumpForward() {
    // show position on display
    display.showPosition();
    // set new position
    display.position = Math.floor(
      Math.min(display.duration, display.position + POSITION_BUMP)
    );
    // update display's last update time
    display.lastUpdate = s.millis();
    // cancel update
    cancelUpdate?.();
    // ask spotify to set position
    await setPosition(display.position);
    // trigger another update later
    createUpdate(500);
  }

  /** update! */
  async function update(getUpdateCanceled?: () => boolean) {
    try {
      // get new status from spotify
      let status = await getStatus();
      // if this update was canceled, get out
      if (getUpdateCanceled?.()) return;
      // update display values based on new status
      display.hasStatus = true;
      display.playing = status.is_playing;
      display.songName = status.item?.name ?? "Not playing";
      display.duration = status.item?.duration_ms ?? 1;
      display.position = status.progress_ms ?? 0;
      display.volume = status.device?.volume_percent ?? 0;
      display.lastUpdate = s.millis();
    } catch {
      // if something went wrong, indicate that we don't have a status
      display.hasStatus = false;
    }
    // trigger another update later
    createUpdate();
  }

  /** request another update in the future */
  function createUpdate(time = REFRESH_FREQ) {
    // cancel any exisiting pending update
    cancelUpdate?.();
    // yay closures! can't do this in python :D
    let shouldCancel = false;
    let getShouldCancel = () => shouldCancel;
    // use setTimeout to trigger the update later
    let handler = window.setTimeout(() => update(getShouldCancel), time);
    // update the cancel update callback...
    cancelUpdate = () => {
      // to mark that this update should be canceled
      shouldCancel = true;
      // and clear the timeout, if it's still active
      clearTimeout(handler);
    };
  }

  /** callback for received serial data */
  function serialRecv() {
    // read a line from the serial port
    let nextLine = serial.readLine();
    // it's probably nothing, so return if it is
    if (!nextLine) return;
    // if not,
    try {
      // try parsing as json
      let data = JSON.parse(nextLine);
      // if it's an IR command
      if (data.type === "ircommand") {
        // dispatch to the IR throttler
        remote.dispatch(data.command, data.time);
      } else if (data.type === "debug") {
        // if it's a debug message, print to the console
        console.warn(data);
      }
    } catch (e) {
      // if something else horrible happened, print that out
      console.warn("[sketch] parse error", e);
    }
  }

  // draw loop called every frame
  s.draw = () => {
    // update the display
    display.tic(s.deltaTime, s.millis());
  };
}
