var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginResult = document.getElementById("result");

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
			document.cookie = "username=" + users[i].username + ";path=/";
      document.cookie = `class=${users[i].class};path=/;${!users[i].class ? "expires=Thu, 01 Jan 1970 00:00:01 GMT" : ""}`;
			location.replace("../");
			return;
		}
	}
	loginResult.style.display = "block";
	loginResult.innerHTML = "Invalid Account Credentials";
}