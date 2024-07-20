var usernameTitle = document.getElementById("username-title");
var itemsDiv = document.getElementById("items");
var cartDiv = document.getElementById("cart");
var foodRadio = document.getElementById("selection-food");
var drinksRadio = document.getElementById("selection-drinks");
var snacksRadio = document.getElementById("selection-snacks");
var confirmOverlay = document.getElementById("confirm-overlay");
var confirmItems = document.getElementById("confirm-items");
var confirmPrice = document.getElementById("confirm-price");
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

  usernameTitle.innerHTML = `Hello, ${getCookie("username")}${checkCookie("class") ? ' (' + getCookie("class") + ')' : ""}!`
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
  (function() {
    for (let i = 0; i < newCart.cart.length; i++) {
      if (newCart.cart[i].index == index) {
        newCart.cart[i].count += 1;
        return;
      }
    }
    // If no item found
    var newItem = {"index": index, "count": 1}
    newCart.cart.push(newItem);
  })();

  setCookie("cart", JSON.stringify(newCart), 365);
  updateCart();
}

function updateCart() {
  cartDiv.innerHTML = "";
  // Check if cookie exists 
  if (!getCookie("cart")) return;
  var cart = JSON.parse(getCookie("cart")).cart
  var totalPrice = 0;

  for (let i = 0; i < cart.length; i++) {
    var itemIndex = cart[i].index.split(",");
    const newDiv = document.createElement("div");
    newDiv.innerHTML = `
      <p>${subMenu[itemIndex[0]][itemIndex[1]]}</p>
      <button onclick="changeItemCount('${itemIndex[0]},${itemIndex[1]}', false)">-</button>
      <p>${cart[i].count}</p>
      <button onclick="changeItemCount('${itemIndex[0]},${itemIndex[1]}', true)">+</button>
    `

    cartDiv.appendChild(newDiv);
    // Count total price
    for (let j = 0; j < cart[i].count; j++) {
      totalPrice += subMenuPrice[itemIndex[0]][itemIndex[1]];
    }
  }

  cartDiv.innerHTML += `<p>=RM${totalPrice}</p>`
  cartDiv.innerHTML += "<a onclick='confirmOrder()'>CONFIRM ORDER</a>"
}

function changeItemCount(index, increase) {
  var cart = JSON.parse(getCookie("cart")).cart
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
  console.log(confirmOverlay)
  confirmOverlay.style.display = confirmOverlay.style.display != "block" ? "block" : "none";
  var cart = JSON.parse(getCookie("cart")).cart;
  var totalPrice = 0;
  confirmItems.innerHTML = ""

  for (let i = 0; i < cart.length; i++) {
    let index = cart[i].index.split(",")
    const newDiv = document.createElement("div");
    newDiv.classList.add("confirm-item-details")
    newDiv.innerHTML = `
      <div class="confirm-item-count"><p>${cart[i].count}</p></div>
      <p>${subMenu[index[0]][index[1]]}</p>
    `
    confirmItems.appendChild(newDiv);

    for (let j = 0; j < cart[i].count; j++) {
      totalPrice += subMenuPrice[index[0]][index[1]];
    }
  }
  confirmPrice.innerHTML = `TOTAL = RM${totalPrice}`
}

function sendOrder() {
  var cart = JSON.parse(getCookie("cart")).cart
  var order = [];
  var date = new Date();

  for (let i = 0; i < cart.length; i++) {
    for (let j = 0; j < cart[i].count; j++) {
      order.push(cart[i].index)
    }
  }

  fetch("./newOrder", {
    method: "POST",
    body: JSON.stringify({
      name: getCookie("username"),
      class: checkCookie("class") ? getCookie("class") : "Teacher",
      orders: order.join("/"),
      time: `${date.getHours() < 10 ? "0" : ""}${date.getHours()}${date.getMinutes()}`
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
    .then((response) => response.json())
    .then((json) => console.log(json));
}
//==============================================
//Event listeners 
// document.getElementById("section-food").addEventListener("onclick", changeSection());

// Scroll horizontally without pressing shift (Creds: https://stackoverflow.com/questions/40855884/horizontal-scroll-without-holding-shift)
confirmItems.addEventListener("wheel", (evt) => {
      confirmItems.scrollLeft += (evt.deltaY * .5);
});
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
