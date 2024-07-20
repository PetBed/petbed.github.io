var usernameTitle = document.getElementById("username-title")
var itemsDiv = document.getElementById("items");
var foodRadio = document.getElementById("selection-food");
var drinksRadio = document.getElementById("selection-drinks");
var snacksRadio = document.getElementById("selection-snacks");
var menu = subMenu = subMenuPrice = [];

async function init() {
  if (getCookie("username") == "") {
    window.location.href = "./login";
	return;
  }

  await fetch("../Data/items.json")
		.then((response) => response.json())
		.then((json) => {
        menu = json.menu;
        subMenu = json.subMenu;
        subMenuPrice = json.subMenuPrice;
  });

  usernameTitle.innerHTML = `Hello, ${getCookie("username")}!`
  
  changeSection(0);
}

function logout() {
	deleteCookie("username", "/");
	window.location.href = "./login";
}

function changeSection(index) {
  itemsDiv.innerHTML = "";

  for (let i = 0; i < subMenu[index].length; i++) {
    const newDiv = document.createElement("div");
    newDiv.id = ""; //might be useless
    newDiv.innerHTML = `
      <img src="">
      <p>${subMenu[index][i]}</p>
      <p>RM${subMenuPrice[index][i]}</p>
      <button onclick="addItem('${index},${i}')">+</button>
    `;
    itemsDiv.appendChild(newDiv);
  }
}

function addItem(index) {
  var newCart = checkCookie("cart") ? JSON.parse(getCookie("cart")) : {cart: []};
  var newItem = {"index": index, "count": 1}
  newCart.cart.push(newItem);
  setCookie("cart", JSON.stringify(newCart), 365);
  console.log(JSON.parse(getCookie("cart")));
}
deleteCookie("cart", "")

//==============================================
//Event listeners 
// document.getElementById("section-food").addEventListener("onclick", changeSection());
//==============================================
//Cookie things
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

function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
	let expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires;
}

function deleteCookie( name, path ) {
	if( checkCookie( name ) ) {
		document.cookie = name + "=" + ((path) ? ";path="+path:"") + ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
		return;
	}
	console.warn("No cookie found");
  }
