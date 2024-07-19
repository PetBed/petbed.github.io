var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginResult = document.getElementById("result");

async function login() {
	var users;
	await fetch("./users.json")
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
			location.replace("../");
			return;
		}
	}
	loginResult.style.display = "block";
	loginResult.innerHTML = "Invalid Account Credentials";
}