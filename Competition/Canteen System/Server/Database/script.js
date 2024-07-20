const tableData = document.getElementsByClassName("table-data")[0];
const tableHead = document.getElementsByClassName("table-head")[0];
const sortOption = document.getElementById("sort-options");
const reverseOption = document.getElementById("reverse");
const filterDone = document.getElementById("filter-done");
const filterPending = document.getElementById("filter-pending");


// var menu = ["Food", "Drinks", "Snacks"];
// var subMenu = [
// 	["Nasi Ayam", "Nasi Kari", "Kueh Tiaw", "Mi Goreng"],
// 	["Milo-S", "Milo-L", "Sirap", "Sprite"],
// 	["Ayam", "Nugget", "Sosej", "Keropok"],
// ];
// var subMenuPrice = [
// 	[5, 4, 3, 3],
// 	[2, 3, 2, 2],
// 	[2, 2, 2, 3],
// ];
var menu = subMenu = subMenuPrice = [];

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
	await createTable(getCookie("sortType"));
  sortOption.value = getCookie("sortType");

  function setSelectedValue(selectObj, valueToSet) {
    for (var i = 0; i < selectObj.options.length; i++) {
        if (selectObj.options[i].text== valueToSet) {
            selectObj.options[i].selected = true;
            return;
        }
    }
  }
  
  setSelectedValue(sortOption, getCookie("sortType") != "" ? getCookie("sortType") : "Order");
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
        <tr>
            <th>No.</th>
            <th>Name</th>
            <th>Class</th>
            <th>Time</th>
            <th>Order</th>
            <th>Cost</th>
        </tr>`;

		await sortOrderList(sortType);
		outerloop: for (let i = 0; i < orderList.length; i++) {
			orders = "";
			time = "";
			cost = 0;
      const searchParam = new URLSearchParams(window.location.search).get("searchParam")

			//set order
			for (let j = 0; j < orderList[sortedOrderList[i]].order.length; j++) {        
				let menuIndex = orderList[sortedOrderList[i]].order[j].index[0];
				let itemIndex = orderList[sortedOrderList[i]].order[j].index[1];
        let done = orderList[sortedOrderList[i]].order[j].done
        
        checkFilters: if (searchParam === "pending" && done) {
          continue outerloop;
        } else if (searchParam === "done" && !done) {
          continue outerloop;
        } else if (searchParam === "doing") {
          for (let k = 0; k < orderList[sortedOrderList[i]].order.length; k++) {
            if ((!done && orderList[sortedOrderList[i]].order[k].done == true) || (done && orderList[sortedOrderList[i]].order[k].done == false)) {
              break checkFilters;
            }
          };
          continue outerloop;
        }

				orders += `<form action="../doneOrder" method="post" target="vm" onsubmit="loop()"> <button type="submit" name="orderIndex" value="${sortedOrderList[i]},${j}" class="${orderList[sortedOrderList[i]].order[j].done ? 'completed-order' : ''}">${(j + 1)}. ${subMenu[menuIndex][itemIndex]}</button></form>`;
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
			createTableRow(orders, orderList[sortedOrderList[i]].name, orderList[sortedOrderList[i]].class, cost, time);
		}
	} else {
		tableHead.innerHTML = `
        <tr>
            <th>No.</th>
            <th>Order Type</th>
            <th>Count</th>
            <th>Done</th>
        </tr>`;
		writeOrders();
	}
}

//==================================================
//Table construction functions
function createTableRow(order, name, className, cost, time) {
	//used className instead of class cause class is reserved
	const newRow = document.createElement("tr");
	newRow.innerHTML = `
        <td>${tableData.childElementCount + 1}.</td>
        <td>${name}</td>
        <td>${className}</td>
        <td>${time}</td>
        <td>${order}</td>
        <td>${cost}</td>
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
		const newRowHeader = document.createElement("tr");
		newRowHeader.classList.add("table-order-header");
		newRowHeader.innerHTML = `<td colspan=4>${menu[i]}</td>`;
		tableData.appendChild(newRowHeader);

		for (let j = 0; j < orderStatus.length; j++) {
			if (subMenu[i].indexOf(orderStatus[j].name) > -1) {
				sortedOrderStatus.push(orderStatus[j]);
			}
		}

		for (let j = 0; j < sortedOrderStatus.length; j++) {
			const newRow = document.createElement("tr");
			newRow.id = `table-row-${sortedOrderStatus[j].name.toLowerCase()}`;

			newRow.innerHTML = `
            <td>${j + 1}.</td>
            <td>${sortedOrderStatus[j].name}</td>
            <td>${sortedOrderStatus[j].count}</td>
            <td>${sortedOrderStatus[j].done}</td>
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
  const url = new URL(window.location)
  var searchParams = "";
  const searchParam = new URLSearchParams(window.location.search).get("searchParam")

  if (type == "" || type == searchParam) {
    document.getElementById(`filter-${type}`).classList.remove("filter-selected");
    history.pushState(null, '', url.toString().split("?")[0]);
    createTable(getCookie("sortType"));
    return;
  }

  searchParams = type;
  try {
    document.getElementsByClassName("filter-selected")[0].classList.remove("filter-selected");
  } catch (err) {
    // console.warn(err);
  }
  document.getElementById(`filter-${type}`).classList.add("filter-selected");
  
  url.searchParams.set("searchParam", searchParams)
  history.pushState(null, '', url);

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