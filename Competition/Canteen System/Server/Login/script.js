var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginResult = document.getElementById("result");
var rememberMe = document.getElementById("remember-me");

function init() {
  if (checkCookie("username")) {
    location.replace(getCookie("class") == "Admin" ? "../admin" : "../");
  }
}

async function login() {
	var users;
	await fetch("../Data/users.json")
		.then((response) => response.json())
		.then((json) => {
			users = json.users;
		});

	for (i = 0; i < users.length; i++) {
		console.log(users[i].username);
		if (usernameInput.value == users[i].username && passwordInput.value == users[i].password) {
			loginResult.style.display = "block";
			loginResult.innerHTML = "Login Succesful!";
			document.cookie = `username=${users[i].username}; ${rememberMe.checked ? "expires=Sat, 01 Jan 2050 00:00:01 GMT;" : ""} path=/`;
      document.cookie = `class=${users[i].class};path=/;${!users[i].class ? "expires=Thu, 01 Jan 1970 00:00:01 GMT" : ""}`;
			location.replace(users[i].class == "Admin" ? "../admin" : "../");
			return;
		}
	}
	loginResult.style.display = "block";
	loginResult.innerHTML = "Invalid Account Credentials";
}

function checkCookie(name) {
	return document.cookie.split(";").some((c) => {
		return c.trim().startsWith(name + "=");
	});
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == " ") {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}