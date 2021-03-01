import { parseQueryString } from "../lib/request";
import { setAccessToken } from "../lib/spotify";
import P5 from "p5";
import sketch from "../sketch";

function getNewAccessToken() {
  location.href = "./index.html";
}
function initialize() {
  // if we didn't get access, go back to login page
  if (location.search.startsWith("?error") || !location.hash) {
    getNewAccessToken();
  }

  // make sure we actually did get an access code...
  let params = parseQueryString(location.hash.substr(1));
  if (!params["access_token"]) {
    getNewAccessToken();
  }
  setAccessToken(params["access_token"], getNewAccessToken);
  // remove access token from url
  history.replaceState(null, "", location.origin + location.pathname);

  // launch our P5 sketch!
  const app = new P5(sketch);
  app; // a no-op a day keeps the linter away!
}
initialize();
