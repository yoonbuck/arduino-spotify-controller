import { makeQueryString, request } from "./request";
import type { RequestOptions } from "./request";

const CLIENT_ID = "5fef7ea7fd8744aba9aa3d3614b214bb";
const REDIRECT_URI =
  location.origin + location.pathname.replace(/index\.html$/, "") + "app.html";
const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
];
const AUTHORIZE_BASE = "https://accounts.spotify.com/authorize?";
const API_BASE = "https://api.spotify.com/v1";

export function getAuthorizationUrl() {
  const query = {
    client_id: CLIENT_ID,
    response_type: "token",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
  };
  return AUTHORIZE_BASE + makeQueryString(query);
}

let accessToken: string = null;
let invalidAccessTokenCallback = () => {};
export function setAccessToken(token: string, cb?: () => void) {
  accessToken = token;
  invalidAccessTokenCallback = cb ?? invalidAccessTokenCallback;
}
export function getAccessToken(): string {
  return accessToken;
}

export function play() {
  return apiRequest("/me/player/play", {
    method: "PUT",
  });
}

export function pause() {
  return apiRequest("/me/player/pause", {
    method: "PUT",
  });
}

export function skipNext() {
  return apiRequest("/me/player/next", {
    method: "POST",
  });
}

export function skipPrevious() {
  return apiRequest("/me/player/previous", {
    method: "POST",
  });
}

export function setShuffleMode(shuffle: boolean) {
  return apiRequest("/me/player/shuffle", {
    method: "PUT",
    query: {
      state: shuffle.toString(),
    },
  });
}

export type ShuffleMode = "track" | "context" | "off";
export function setRepeatMode(repeat: ShuffleMode) {
  return apiRequest("/me/player/repeat", {
    method: "PUT",
    query: {
      state: repeat,
    },
  });
}

export function setPosition(position: number) {
  return apiRequest("/me/player/seek", {
    method: "PUT",
    query: {
      position_ms: position.toString(),
    },
  });
}

export function setVolume(volume: number) {
  return apiRequest("/me/player/volume", {
    method: "PUT",
    query: {
      volume_percent: volume.toString(),
    },
  });
}

export function getStatus(): Promise<any> {
  return apiRequest("/me/player").then((res) => res.json());
}

function apiRequest(endpoint: string, opts: RequestOptions = {}) {
  opts.bearer = accessToken;
  const res = request(API_BASE + endpoint, opts);
  res.then((res) => {
    if (res.status === 401) {
      invalidAccessTokenCallback();
    }
  });
  return res;
}

window["setAccessToken"] = setAccessToken;
