import { getAuthorizationUrl } from "../lib/spotify";

function login() {
  location.href = getAuthorizationUrl();
}

document.getElementById("login").addEventListener("click", function () {
  if ((document.getElementById("remember") as HTMLInputElement).checked) {
    localStorage.setItem("autologin", "1");
  }
  login();
});

if (localStorage.getItem("autologin") === "1") login();
