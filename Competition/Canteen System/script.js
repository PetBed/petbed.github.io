const tableData = document.getElementsByClassName("table-data")[0];
const tableHead = document.getElementsByClassName("table-head")[0];
const sortOption = document.getElementById("sort-options");
const reverseOption = document.getElementById("reverse");

var menu = ["Food", "Drinks", "Snacks"];
var subMenu = [
    ["Nasi Ayam", "Nasi Kari", "Kueh Tiaw", "Mi Goreng"],
    ["Milo-S", "Milo-L", "Sirap", "Sprite"],
    ["Ayam", "Nugget", "Sosej", "Keropok"]
];
var subMenuPrice = [
    [5, 4, 3, 3],
    [2, 3, 2, 2],
    [2, 2, 2, 3]
];
var orderListJSON, orderList, newOrderListJSON;
var sortedOrderList = [];
var reverseSort = false;
var orderStatus = [];

init();
setInterval(async () => {
    await fetch('./data.json')
        .then((response) => response.json())
        .then(json => {
            json = JSON.stringify(json);
            json = json.replaceAll("\\", "");
            json = json.replace('ords\":\"', "ords\":");
            json = json.replace('}]\"}', "}]}");
            newOrderListJSON = JSON.parse(json);
            // orderListJSON
            return newOrderListJSON;
        });

    loop();
}, 1000);

async function loop() {
    if (JSON.stringify(orderListJSON) == JSON.stringify(newOrderListJSON)) {
        return;
    }
    
    console.log("Something changed!");
    orderListJSON = newOrderListJSON;
    orderList = orderListJSON.ords
    await createTable(sortOption.value);
}

async function getOrders() {
    await fetch('./data.json')
        .then((response) => response.json())
        .then(json => {
            json = JSON.stringify(json);
            json = json.replaceAll("\\", "");
            console.log(json);
            json = json.replace('ords\":\"', "ords\":");
            console.log(json);
            json = json.replace('}]\"}', "}]}");
            console.log(json);
            orderListJSON = JSON.parse(json);
            // orderListJSON
            // console.log(orderListJSON); 
            return orderListJSON;
        });

    orderList = orderListJSON.ords
}

async function init() {
    await getOrders();
    await createTable(sortOption.value);
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
        </tr>`

        await sortOrderList(sortType);
        for (let i = 0; i < orderList.length; i++) {
            orders = "";
            time = "";
            cost = 0;
            //set order
            for (let j = 0; j < orderList[sortedOrderList[i]].o.length; j++) {
                let menuIndex = orderList[sortedOrderList[i]].o[j][0];
                let itemIndex = orderList[sortedOrderList[i]].o[j][1];
                let labelId = "" + i + j;

                orders += `<input type=checkbox id="input-${labelId}"> <label for="input-${labelId}">` + (j + 1) + ". " + subMenu[menuIndex][itemIndex] + "</label><br>";
            }
            
            //set cost
            for (let j = 0; j < orderList[sortedOrderList[i]].o.length; j++) {
                let menuIndex = orderList[sortedOrderList[i]].o[j][0];
                let itemIndex = orderList[sortedOrderList[i]].o[j][1];
    
                cost += parseInt(subMenuPrice[menuIndex][itemIndex]);
            }
            cost = "RM" + cost;
    
            //set time
            time += orderList[sortedOrderList[i]].t.charAt(0) + orderList[sortedOrderList[i]].t.charAt(1) + ":" + orderList[sortedOrderList[i]].t.charAt(2) + orderList[sortedOrderList[i]].t.charAt(3);
            createTableRow(orders, orderList[sortedOrderList[i]].n, orderList[sortedOrderList[i]].c, cost, time);
        }
    } else {
        tableHead.innerHTML = `
        <tr>
            <th>No.</th>
            <th>Order Type</th>
            <th>Count</th>
            <th>Done</th>
        </tr>`
        writeOrders();
    }
}


//==================================================
//Table construction functions
function createTableRow(order, name, className, cost, time) { //used className instead of class cause class is reserved
    const newRow = document.createElement("tr");
    newRow.innerHTML = 
    `
        <td>${tableData.childElementCount+1}.</td>
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
            tempArray.push(orderList[i].t)
        }
    } else if (sortType == "price") {
        var cost;
        for (let i = 0; i < orderList.length; i++) {
            cost = 0;
            for (let j = 0; j < orderList[i].o.length; j++) {
                let menuIndex = orderList[i].o[j][0];
                let itemIndex = orderList[i].o[j][1];

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
            tempArray.push(orderList[i].n)
        }
    } else if (sortType == "class") {
        for (let i = 0; i < orderList.length; i++) {
            tempArray.push(orderList[i].c);
        }
    }
    else {
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
                    console.log("Duped")
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
    // console.log(orderList);

    for (let i = 0; i < orderList.length; i++) {
        for (let j = 0; j < orderList[i].o.length; j++) {
            // console.log(subMenu[orderList[i].o[j][0]][orderList[i].o[j][1]]);

            const k = orderStatus.findIndex(e => e.name === subMenu[orderList[i].o[j][0]][orderList[i].o[j][1]]);
            if (k > -1) {
                orderStatus[k].count += 1;  
            } else {
                var newObject = {}
                newObject.name = subMenu[orderList[i].o[j][0]][orderList[i].o[j][1]];
                newObject.count = 1;
                orderStatus.push(newObject);
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
            newRow.innerHTML = 
            `
            <td>${j+1}.</td>
            <td>${sortedOrderStatus[j].name}</td>
            <td>${sortedOrderStatus[j].count}</td>
            `;
            tableData.appendChild(newRow);
        }
    }
}

//==================================================
//Sorting thingies
function sortChanged() {
    createTable(sortOption.value);
}

function reverseChanged() {
    reverseSort = reverseOption.checked;
    createTable(sortOption.value);
}


//==================================================
//Cookie functions
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires;
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

