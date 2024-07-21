const tableData = document.getElementsByClassName("table-data")[0];
const tableHead = document.getElementsByClassName("table-head")[0];

var newUserListJSON, userListJSON, userList;

async function init() {
	if (getCookie("class") != "Admin") {
		window.location.href = "../login";
		return;
	}

	await fetch("../Data/items.json")
		.then((response) => response.json())
		.then((json) => {
			menu = json.menu;
			subMenu = json.subMenu;
			subMenuPrice = json.subMenuPrice;
		});

	await fetch("../Data/users.json")
		.then((response) => response.json())
		.then((json) => {
			userListJSON = json;
		});

	userList = userListJSON.users;
  createTable();
}

setInterval(async () => {
  await fetch("../Data/users.json")
  .then((response) => response.json())
  .then((json) => {
    newUserListJSON = json;
  });
  
	loop();
}, 100);

async function loop() {
  if (JSON.stringify(userListJSON) == JSON.stringify(newUserListJSON)) {
    return;
	}
  
	userListJSON = newUserListJSON;
	userList = userListJSON.users;
	await createTable();
}

function logout() {
	deleteCookie("username", "/");
	deleteCookie("class", "/");
	deleteCookie("cart", "/");
	window.location.href = "../login";
}
//======================================
//Create table
async function createTable() {
	tableData.innerHTML = "";
  tableHead.innerHTML = `
      <tr>
          <th>No.</th>
          <th>Name</th>
          <th>Password</th>
          <th>Class</th>
      </tr>`;

  for (let i = 0; i < userList.length; i++) {
    createTableRow(userList[i].username, userList[i].password, userList[i].class == undefined ? "Teacher" : userList[i].class);
  }
}

function createTableRow(name, password, className) {
	//used className instead of class cause class is reserved
	const newRow = document.createElement("tr");
	newRow.innerHTML = `
        <td>${tableData.childElementCount + 1}.</td>
        <td>${name}</td>
        <td>${password}</td>
        <td>${className}</td>
    `;
	tableData.appendChild(newRow);
}

function sortOrderList(sortType) {
	var tempArray = [];
	var sortedTempArray = [];
	sortedOrderList = [];

	if (sortType == "time") {
		for (let i = 0; i < orderList.length; i++) {
			tempArray.push(orderList[i].time);
		}
	} else if (sortType == "price") {
		var cost;
		for (let i = 0; i < orderList.length; i++) {
			cost = 0;
			for (let j = 0; j < orderList[i].order.length; j++) {
				let menuIndex = orderList[i].order[j].index[0];
				let itemIndex = orderList[i].order[j].index[1];
				cost += parseInt(subMenuPrice[menuIndex][itemIndex]);
			}
			if (cost < 10) {
				cost = "00" + cost;
			} else if (cost < 100) {
				cost = "0" + cost;
			}
			tempArray.push(cost);
		}
	} else if (sortType == "name") {
		for (let i = 0; i < orderList.length; i++) {
			tempArray.push(orderList[i].name);
		}
	} else if (sortType == "class") {
		for (let i = 0; i < orderList.length; i++) {
			tempArray.push(orderList[i].class);
		}
	} else {
		for (let i = 0; i < orderList.length; i++) {
			sortedOrderList.push(i);
		}
		return;
	}

	sortedTempArray = tempArray.toSorted();

	if (reverseSort) {
		sortedTempArray.reverse();
	}

	var matchValue, dupeCount;

	for (let i = 0; i < tempArray.length; i++) {
		matchValue = sortedTempArray[i];
		dupeCount = 0;
		// console.log(tempArray)
		if (sortedTempArray[i] == sortedTempArray[i + 1]) {
			for (let j = 0; j < tempArray.length - i; j++) {
				// console.log(sortedTempArray);
				if (sortedTempArray[i].toString() == sortedTempArray[i + j]) {
					dupeCount++;
				} else {
					break;
				}
			}
			// console.log(`Duped item: ${sortedTempArray[i]}; Count: ${dupeCount}`);
			for (let j = 0; j < tempArray.length; j++) {
				if (tempArray[j].toString() == matchValue.toString()) {
					sortedOrderList.push(j);
					// console.log("Duped");
				}
			}
			i += dupeCount - 1;
		} else {
			sortedOrderList.push(tempArray.indexOf(sortedTempArray[i]));
			// console.log(tempArray.indexOf(sortedTempArray[i]))
			// console.log(sortedTempArray[i], tempArray, tempArray.indexOf(sortedTempArray[i]))
		}

		// console.log(sortedOrderList);
	}
}

//======================================
// Cookies
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
