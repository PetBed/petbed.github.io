const tableData = document.getElementsByClassName("table-data")[0];
const sortOption = document.getElementById("sort-options");
const reverseOption = document.getElementById("reverse");

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
    createTable(sortOption.value);
}

async function getOrders() {
    await fetch('./data.json')
        .then((response) => response.json())
        .then(json => {
            json = JSON.stringify(json);
            json = json.replaceAll("\\", "");
            json = json.replace('ords\":\"', "ords\":");
            json = json.replace('}]\"}', "}]}");
            orderListJSON = JSON.parse(json);
            // orderListJSON
            console.log(orderListJSON); 
            return orderListJSON;
        });

    orderList = orderListJSON.ords
}

async function init() {
    await getOrders();
    createTable(sortOption.value);
}

//==================================================
//Create table
function createTable(sortType) {
    var orders = "";
    var time;
    var cost;
    tableData.innerHTML = "";
    sortOrderList(sortType);

    for (let i = 0; i < orderList.length; i++) {
        orders = "";
        time = "";
        cost = 0;
        //set order
        console.log(orderList[sortedOrderList[i]])
        for (let j = 0; j < orderList[sortedOrderList[i]].o.length; j++) {
            let menuIndex = orderList[sortedOrderList[i]].o[j][0];
            let itemIndex = orderList[sortedOrderList[i]].o[j][1];

            orders += (j + 1) + ". " + subMenu[menuIndex][itemIndex] + "<br>";
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
}


//==================================================
//Table construction functions
function createTableRow(order, name, className, cost, time) { //used className instead of class cause class is reserved
    const newRow = document.createElement("tr");
    newRow.innerHTML = 
    `
        <td>${tableData.childElementCount+1}.</td>
        <td>${order}</td>
        <td>${name}</td>
        <td>${className}</td>
        <td>${cost}</td>
        <td>${time}</td>
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
            tempArray.push(cost);
        }
        
    } else if (sortType == "class") {
        var teacher = [];
        var pa = [];
        var tempObjectNumArray = [];
        var tempSortedArray = [];

        for (let i = 0; i < orderList.length; i++) {
            if (orderList[i].c == "PA") {
                pa.push(orderList[i].c);
            } else if (orderList[i].c == "Teacher") {
                teacher.push(orderList[i].c);
            } else {
                tempSortedArray.push(orderList[i].c)
            }
            tempArray.push(orderList[i].c);
        }
        // console.log(tempArray);

        for (let i = 0; i < tempSortedArray.length; i++) {
            var object = {"num": tempSortedArray[i].charAt(0), "letter": tempSortedArray[i].charAt(1)};
            tempObjectNumArray.push(object);
        }
        tempObjectNumArray.sort((firstItem, secondItem) => firstItem.num - secondItem.num)
        tempSortedArray = [];
        // console.log(tempObjectNumArray)

        for (let i = 1; i <= 5; i++) {
            var tempObjectArray = [];
            for (let j = 0; j < tempObjectNumArray.length; j++) {
                if (tempObjectNumArray[j].num == i.toString()) {
                    tempObjectArray.push(tempObjectNumArray[j]);
                }
            }

            tempObjectArray.sort(function(a, b) {
                var textA = a.letter.toUpperCase();
                var textB = b.letter.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });

            for (let i = 0; i < tempObjectArray.length; i++) {
                tempSortedArray.push(tempObjectArray[i].num + tempObjectArray[i].letter);
            }
        }
        
        
        for (let i = 0; i < pa.length; i++) {
            tempSortedArray.push("PA");
        }
        for (let i = 0; i < teacher.length; i++) {
            tempSortedArray.push("Teacher");
        }
        
        sortedTempArray = tempSortedArray;
        // console.log(tempSortedArray);
    }
    else {
        for (let i = 0; i < orderList.length; i++) {
            sortedOrderList.push(i);
        }
        return;
    }
    
    if (sortType != "class") {
        sortedTempArray = tempArray.toSorted();
    }

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
                console.log(sortedTempArray);
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