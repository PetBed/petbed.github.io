var usernameTitle = document.getElementById("username-title");
var itemsDiv = document.getElementById("items");
var cartDiv = document.getElementById("cart");
var foodRadio = document.getElementById("selection-food");
var drinksRadio = document.getElementById("selection-drinks");
var snacksRadio = document.getElementById("selection-snacks");
var confirmOverlay = document.getElementById("confirm-overlay");
var confirmItems = document.getElementById("confirm-items");
var confirmPrice = document.getElementById("confirm-price");
var transferDiv = document.getElementById("transfer-div");
var placeOrder = document.getElementById("place-order");
var menu = (subMenu = subMenuPrice = []);

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

	usernameTitle.innerHTML = `Hello, ${getCookie("username")}${checkCookie("class") ? " (" + getCookie("class") + ")" : ""}!`;
	changeSection(0);
	updateCart();
}

function logout() {
	deleteCookie("username", "/");
	deleteCookie("cart", "/");
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
	// Immediately invoked function expression (IIFE)
	(function () {
		for (let i = 0; i < newCart.cart.length; i++) {
			if (newCart.cart[i].index == index) {
				newCart.cart[i].count += 1;
				return;
			}
		}
		// If no item found
		var newItem = {index: index, count: 1};
		newCart.cart.push(newItem);
	})();

	setCookie("cart", JSON.stringify(newCart), 365);
	updateCart();
}

function updateCart() {
	cartDiv.innerHTML = "";
	// Check if cookie exists
	if (!getCookie("cart")) return;
	var cart = JSON.parse(getCookie("cart")).cart;
	var totalPrice = 0;

	for (let i = 0; i < cart.length; i++) {
		var itemIndex = cart[i].index.split(",");
		const newDiv = document.createElement("div");
		newDiv.innerHTML = `
      <p>${subMenu[itemIndex[0]][itemIndex[1]]}</p>
      <button onclick="changeItemCount('${itemIndex[0]},${itemIndex[1]}', false)">-</button>
      <p>${cart[i].count}</p>
      <button onclick="changeItemCount('${itemIndex[0]},${itemIndex[1]}', true)">+</button>
    `;

		cartDiv.appendChild(newDiv);
		// Count total price
		for (let j = 0; j < cart[i].count; j++) {
			totalPrice += subMenuPrice[itemIndex[0]][itemIndex[1]];
		}
	}

	cartDiv.innerHTML += `<p>=RM${totalPrice}</p>`;
	cartDiv.innerHTML += "<a onclick='confirmOrder()'>CONFIRM ORDER</a>";
}

function changeItemCount(index, increase) {
	var cart = JSON.parse(getCookie("cart")).cart;
	for (let i = 0; i < cart.length; i++) {
		if (cart[i].index == index) {
			cart[i].count += increase ? 1 : -1;
		}

		if (cart[i].count < 1) {
			cart.splice(i, 1);
		}

		// Check if cart is empty...
		if (!Array.isArray(cart) || !cart.length) {
			// Delete cookie (To avoid conflicts in addItem function)
			deleteCookie("cart");
			updateCart();
			return;
		}
	}

	var newCart = JSON.parse(getCookie("cart"));
	newCart.cart = cart;
	setCookie("cart", JSON.stringify(newCart), 365);
	updateCart();
}

function confirmOrder() {
	console.log(confirmOverlay);
	confirmOverlay.style.display = confirmOverlay.style.display != "block" ? "block" : "none";
	var cart = JSON.parse(getCookie("cart")).cart;
	var totalPrice = 0;
	confirmItems.innerHTML = "";

	for (let i = 0; i < cart.length; i++) {
		let index = cart[i].index.split(",");
		const newDiv = document.createElement("div");
		newDiv.classList.add("confirm-item-details");
		newDiv.innerHTML = `
      <div class="confirm-item-count"><p>${cart[i].count}</p></div>
      <p>${subMenu[index[0]][index[1]]}</p>
    `;
		confirmItems.appendChild(newDiv);

		for (let j = 0; j < cart[i].count; j++) {
			totalPrice += subMenuPrice[index[0]][index[1]];
		}
	}
	confirmPrice.innerHTML = `TOTAL = RM${totalPrice}`;
}

function sendOrder() {
	var cart = JSON.parse(getCookie("cart")).cart;
	var order = [];
	var date = new Date();

	for (let i = 0; i < cart.length; i++) {
		for (let j = 0; j < cart[i].count; j++) {
			order.push(cart[i].index);
		}
	}
	fetch("./newOrder", {
		method: "POST",
		body: JSON.stringify({
			name: getCookie("username"),
			class: checkCookie("class") ? getCookie("class") : "Teacher",
			orders: order.join("/"),
			time: `${date.getHours() < 10 ? "0" : ""}${date.getHours()}${date.getMinutes()}`,
		}),
		headers: {
			"Content-type": "application/json; charset=UTF-8",
		},
	})
		.then((response) => response.json())
		.then((json) => console.log(json));
}

function onlineTransfer() {
	transferDiv.style.display = transferDiv.style.display != "block" ? "block" : "none";
}

//==============================================
// Card validation (Creds: https://javascript.plainenglish.io/how-to-build-a-credit-card-user-interface-with-validation-in-javascript-4f190b6208ad)
// Luhn Algorithm
function validateLuhnAlgorithm(cardNumber) {
	let sum = 0;
	let isEven = false;

	for (let i = cardNumber.length - 1; i >= 0; i--) {
		let digit = parseInt(cardNumber.charAt(i), 10);

		if (isEven) {
			digit *= 2;
			if (digit > 9) {
				digit -= 9;
			}
		}
		sum += digit;
		isEven = !isEven;
	}
	detectCardType(cardNumber);
	return sum % 10 === 0;
}

// Card Type Detection
function detectCardType(cardNumber) {
	const patterns = {
		visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
		mastercard: /^5[1-5][0-9]{14}$/,
		amex: /^3[47][0-9]{13}$/,
		discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
	};

	for (const cardType in patterns) {
		if (patterns[cardType].test(cardNumber)) {
			return cardType;
		}
	}

	return "Unknown";
}

// Expiration Date Validation
function validateExpirationDate(expirationMonth, expirationYear) {
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth() + 1; // January is 0

	if (expirationYear > currentYear) {
		return true;
	} else if (expirationYear === currentYear && expirationMonth >= currentMonth) {
		return true;
	}

	return false;
}

// CVV/CVC Validation
function validateCVV(cvv) {
	const cvvPattern = /^[0-9]{3,4}$/;
	return cvvPattern.test(cvv);
}

// Invalid element alerts
function invalidElement(name) {
	return document.getElementById(`invalid-${name}`);
}

function checkIfCardValid() {
  var checks = ["number", "expire", "verification"];
  placeOrder.style.opacity = 0;
  for (let i = 0; i < checks.length; i++) {
    if (invalidElement(checks[i]).style.opacity == 1 || document.getElementById(`card-${checks[i]}`).value == "") {
      return
    }
  }
  placeOrder.style.opacity = 1;
}
//==============================================
//Event listeners
// document.getElementById("section-food").addEventListener("onclick", changeSection());

// Scroll horizontally without pressing shift (Creds: https://stackoverflow.com/questions/40855884/horizontal-scroll-without-holding-shift)
confirmItems.addEventListener("wheel", (e) => {
	e.preventDefault();
	confirmItems.scrollLeft += e.deltaY * 0.5;
	confirmItems.scrollLeft += e.deltaX * 0.5;
});

document.getElementById("card-number").addEventListener("input", (e) => {
	if (!validateLuhnAlgorithm(e.target.value)) {
		invalidElement("number").style.opacity = 1;
		invalidElement("number").innerHTML = "Invalid credit card number";
		return "Invalid card number";
	} else {
		invalidElement("number").style.opacity = 0;
	}

	// Validate card type
	const cardType = detectCardType(e.target.value);
	if (cardType === "Unknown") {
		invalidElement("number").style.opacity = 1;
		invalidElement("number").innerHTML = "Credit card not supported";
		document.getElementsByClassName("card-type")[0].classList.remove("card-selected");
		return "Unknown card type";
	} else {
		try {
			document.getElementsByClassName("card-selected")[0].classList.remove("card-selected");
		} catch {}
		document.getElementById(`card-${cardType}`).classList.add("card-selected");
		invalidElement("number").style.opacity = 0;
	}

  checkIfCardValid();
});

document.getElementById("card-expire").addEventListener("input", (e) => {
	const dateExpression = new RegExp("^(0[1-9]|1[0-2])/?([0-9]{2})$");
	if (dateExpression.test(e.target.value)) {
		invalidElement("expire").innerHTML = "Invalid expire date";
		invalidElement("expire").style.opacity = 0;
		let data = e.target.value.includes("/") ? e.target.value.split("/") : [e.target.value.slice(0, 2), e.target.value.slice(2, 4)];
		let expirationMonth = data[0];
		let expirationYear = "20" + data[1];
		// Validate expiration date
		if (!validateExpirationDate(expirationMonth, expirationYear)) {
			invalidElement("expire").style.opacity = 1;
			invalidElement("expire").innerHTML = "Card has expired";
		} else {
			invalidElement("expire").style.opacity = 0;
		}
	} else {
		invalidElement("expire").innerHTML = "Invalid expire date";
		invalidElement("expire").style.opacity = 1;
	}

  checkIfCardValid();
});

document.getElementById("card-verification").addEventListener("input", (e) => {
	if (!validateCVV(e.target.value)) {
		invalidElement("verification").style.opacity = 1;
		return "Invalid CVV";
	} else {
		invalidElement("verification").style.opacity = 0;
	}

  checkIfCardValid();
});
//==============================================
//Cookie things
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

function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
	let expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires;
}

function deleteCookie(name, path) {
	if (checkCookie(name)) {
		document.cookie = name + "=" + (path ? ";path=" + path : "") + ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
		return;
	}
	console.warn("No cookie found");
}
