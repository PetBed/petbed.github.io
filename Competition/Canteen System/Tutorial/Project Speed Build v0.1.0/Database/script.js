const tableData = document.getElementsByClassName("table-data")[0];
const tableHead = document.getElementsByClassName("table-head")[0];
const sortOption = document.getElementById("sort-options");
const reverseOption = document.getElementById("reverse");
const filterDone = document.getElementById("filter-done");
const filterPending = document.getElementById("filter-pending");

var menu = (subMenu = subMenuPrice = []);
var orderListJSON, orderList, newOrderListJSON;
var sortedOrderList = [];
var reverseSort = false;
var orderStatus = [];

setInterval(async () => {
	await fetch("../Data/orders.json")
		.then((response) => response.json())
		.then((json) => {
			newOrderListJSON = json;
			return json;
		});

	loop();
}, 100);

async function loop() {
	if (JSON.stringify(orderListJSON) == JSON.stringify(newOrderListJSON)) {
		return;
	}

	// console.log("Something changed!");
	orderListJSON = newOrderListJSON;
	orderList = orderListJSON.orders;
	await createTable(getCookie("sortType"));
}

async function getOrders() {
	await fetch("../Data/orders.json")
		.then((response) => response.json())
		.then((json) => {
			orderListJSON = json;
			return json;
		});

	orderList = orderListJSON.orders;
}

async function init() {
	await fetch("../Data/items.json")
		.then((response) => response.json())
		.then((json) => {
			menu = json.menu;
			subMenu = json.subMenu;
			subMenuPrice = json.subMenuPrice;
		});

	await getOrders();
	await createTable(checkCookie("sortType") ? getCookie("sortType") : "order");
	sortOption.value = checkCookie("sortType") ? getCookie("sortType") : "order";
	// await createTable(sortOption.value);
	// sortOption.value = "name";

	function setSelectedValue(selectObj, valueToSet) {
		for (var i = 0; i < selectObj.options.length; i++) {
			if (selectObj.options[i].text == valueToSet) {
				selectObj.options[i].selected = true;
				return;
			}
		}
	}

	setSelectedValue(sortOption, getCookie("sortType") != "" ? getCookie("sortType") : "Order");
	filterChanged(-1);
}

//==================================================
//Create table
async function createTable(sortType) {
	var orders = "";
	var time;
	var cost;
	tableData.innerHTML = "";
	tableHead.innerHTML = "";

	if (sortType != "order") {
		tableHead.innerHTML = `
            <p>Name</p>
            <p>Class</p>
            <p>Time</p>
            <p>Order</p>
            <p>Cost</p>
            <p style="text-align: center">Payment</p>
            `;

		await sortOrderList(sortType);
		outerloop: for (let i = 0; i < orderList.length; i++) {
			orders = "";
			time = "";
			cost = 0;
			var searchParamList = new URLSearchParams(window.location.search).get("searchParam") != null && new URLSearchParams(window.location.search).get("searchParam") != "" ? new URLSearchParams(window.location.search).get("searchParam").split(",") : [];
			if (searchParamList.length != 0) {
				innerloop: for (let j = 0; j < orderList[sortedOrderList[i]].order.length; j++) {
					let done = orderList[sortedOrderList[i]].order[j].done;
					let failTestCount = 0;

					if (searchParamList.indexOf("pending") != -1 && done) {
						failTestCount += 1;
					}
					if (searchParamList.indexOf("done") != -1 && !done) {
						failTestCount += 1;
					}
					checkFilters: if (searchParamList.indexOf("doing") != -1) {
						for (let k = 0; k < orderList[sortedOrderList[i]].order.length; k++) {
							if ((!done && orderList[sortedOrderList[i]].order[k].done == true) || (done && orderList[sortedOrderList[i]].order[k].done == false)) {
								break checkFilters;
							}
						}
						failTestCount += 1;
					}

					if (failTestCount >= searchParamList.length) {
						continue outerloop;
					}
				}
			}
			//set order
			for (let j = 0; j < orderList[sortedOrderList[i]].order.length; j++) {
				let menuIndex = orderList[sortedOrderList[i]].order[j].index[0];
				let itemIndex = orderList[sortedOrderList[i]].order[j].index[1];
				// let done = orderList[sortedOrderList[i]].order[j].done;

				orders += `<form action="../doneOrder" method="post" target="vm" onsubmit="loop()"> <button type="submit" name="orderIndex" value="${sortedOrderList[i]},${j}" class="${orderList[sortedOrderList[i]].order[j].done ? "completed-order" : ""}"><div class='item-checkbox'></div>${subMenu[menuIndex][itemIndex]}</button></form>`;
			}

			//set cost
			for (let j = 0; j < orderList[sortedOrderList[i]].order.length; j++) {
				let menuIndex = orderList[sortedOrderList[i]].order[j].index[0];
				let itemIndex = orderList[sortedOrderList[i]].order[j].index[1];

				cost += parseInt(subMenuPrice[menuIndex][itemIndex]);
			}
			cost = "RM" + cost;

			//set time
			time += orderList[sortedOrderList[i]].time.charAt(0) + orderList[sortedOrderList[i]].time.charAt(1) + ":" + orderList[sortedOrderList[i]].time.charAt(2) + orderList[sortedOrderList[i]].time.charAt(3);
			createTableRow(orders, orderList[sortedOrderList[i]].name, orderList[sortedOrderList[i]].class, cost, time, sortedOrderList[i]);
		}
	} else {
		tableHead.innerHTML = `
      <p>No.</p>
      <p>Order Item</p>
      <p>Count</p>
      <p>Done</p>
    `;
		writeOrders();
	}
}

//==================================================
//Table construction functions
function createTableRow(order, name, className, cost, time, index) {
	//used className instead of class cause class is reserved
	const newRow = document.createElement("div");
	newRow.innerHTML = `
        <p>${name}</p>
        <p>${className}</p>
        <p>${time}</p>
        <div>${order}</div>
        <p>${cost}</p>
        <div class='checkmark'>
          <a onclick="orderPaid(${index})" class="${orderList[index].paid == true ? "order-paid" : ""}">
            <i class="fa fa-check" aria-hidden="true"></i>
          </a>
        </div>
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

function writeOrders() {
	orderStatus = [];

	for (let i = 0; i < orderList.length; i++) {
		for (let j = 0; j < orderList[i].order.length; j++) {
			// console.log(subMenu[orderList[i].o[j][0]][orderList[i].o[j][1]]);

			var k = orderStatus.findIndex((e) => e.name === subMenu[orderList[i].order[j].index[0]][orderList[i].order[j].index[1]]);
			if (k > -1) {
				orderStatus[k].count += 1;
			} else {
				var newObject = {};
				newObject.name = subMenu[orderList[i].order[j].index[0]][orderList[i].order[j].index[1]];
				newObject.count = 1;
				newObject.done = 0;
				orderStatus.push(newObject);
			}

			k = orderStatus.findIndex((e) => e.name === subMenu[orderList[i].order[j].index[0]][orderList[i].order[j].index[1]]);
			if (orderList[i].order[j].done === true) {
				orderStatus[k].done += 1;
			}
		}
	}

	for (let i = 0; i < 3; i++) {
		var sortedOrderStatus = [];
		const newRowHeader = document.createElement("div");
		newRowHeader.classList.add("table-order-header");
		newRowHeader.innerHTML = `<td colspan=4>${menu[i]}</td>`;
		tableData.appendChild(newRowHeader);

		for (let j = 0; j < orderStatus.length; j++) {
			if (subMenu[i].indexOf(orderStatus[j].name) > -1) {
				sortedOrderStatus.push(orderStatus[j]);
			}
		}

		for (let j = 0; j < sortedOrderStatus.length; j++) {
			const newRow = document.createElement("div");
      newRow.id = `table-row-${sortedOrderStatus[j].name.toLowerCase().replace(" ", "-")}`;

			newRow.innerHTML = `
            <p>${j + 1}.</p>
            <p>${sortedOrderStatus[j].name}</p>
            <p>${sortedOrderStatus[j].count}</p>
            <p>${sortedOrderStatus[j].done}</p>
            `;
			tableData.appendChild(newRow);
		}
	}
}

//==================================================
//Sorting thingies
function sortChanged() {
	document.cookie = "sortType=" + sortOption.value;
	createTable(getCookie("sortType"));
}

function reverseChanged() {
	reverseSort = reverseOption.checked;
	createTable(getCookie("sortType"));
}

//==================================================
//Filters
function filterChanged(type) {
	const url = new URL(window.location);
	var searchParams = [];
	const searchParam = new URLSearchParams(window.location.search).get("searchParam");
	console.log(searchParam != "");
	if (searchParam != null && searchParam != "") {
		searchParams = searchParam.split(",");
	} else {
		searchParams = [];
	}
	if (searchParams.indexOf(type) != -1) {
		searchParams.splice(searchParams.indexOf(type), 1);
	} else {
		if (type != -1) searchParams.push(type);
	}
	let filterSelected = document.querySelectorAll("a.filter-selected");
	Array.prototype.forEach.call(filterSelected, function (e) {
		e.classList.remove("filter-selected");
	});

	console.log(searchParams);
	for (let i = 0; i < searchParams.length; i++) {
		document.getElementById(`filter-${searchParams[i]}`).classList.add("filter-selected");
	}

	url.searchParams.set("searchParam", searchParams.join(","));
	history.pushState(null, "", url);

	createTable(getCookie("sortType"));
}

//==================================================
//Cookie functions
function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
	let expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires;
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

function checkCookie(name) {
	return document.cookie.split(";").some((c) => {
		return c.trim().startsWith(name + "=");
	});
}
