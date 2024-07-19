var usernameTitle = document.getElementById("username-title")
function init() {
  if (getCookie("username") == "") {
    window.location.href = "./login";
	return;
  }

  usernameTitle.innerHTML = `Hello, ${getCookie("username")}!`
}

function logout() {
	deleteCookie("username", "/");
	window.location.href = "./login";
}

function checkCookie(name) {
	return document.cookie.split(';').some(c => {
        return c.trim().startsWith(name + '=');
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

function deleteCookie( name, path ) {
	if( checkCookie( name ) ) {
		document.cookie = name + "=" + ((path) ? ";path="+path:"") + ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
		return;
	}
	console.warn("No cookie found");
  }
  