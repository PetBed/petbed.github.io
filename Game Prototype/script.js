const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const findObjectWithID = (objectID) => itemList.find(o => o.priority === objectID)
const roundValue = (value, decimalPoints) => Math.floor(value * Math.pow(10, decimalPoints)) / Math.pow(10, decimalPoints)

var cash = 0, buyAmount = 1;
var itemList = [];

createNewItem(1, 1, "Item 1", 1, 10, 1.05);
createNewItem(2, 0, "Item 2", 2, 250, 1.20);
createNewItem(3, 0, "Item 3", 3, 5000, 1.45);


function createNewItem(itemID, value, buttonText, priority, basePrice, ratePrice)
{
    var obj = {};
    obj.id = itemID;
    obj.valueID = "value"+itemID;
    obj.buttonID = "button"+itemID;
    obj.text = buttonText;
    obj.basePrice = basePrice;
    obj.ratePrice = ratePrice;
    obj.ownedItemBaseAmount = value
    obj.nextPrice = calculateItemPrice(obj.basePrice, obj.ratePrice, obj.ownedItemBaseAmount);
    obj.ownedItemAmount = 0;
    obj.multipliers = 0;
    obj.baseProduction = 1; 
    obj.priority = priority;
    
    itemList.push(obj);

    const p = document.createElement("p");
    p.setAttribute("id", obj.valueID);
    const valueDiv = document.getElementById("values");
    valueDiv.appendChild(p);

    const button = document.createElement("button");
    button.setAttribute("id", obj.buttonID);
    button.onclick = function() {buyItem(itemID)};
    const buttonDiv = document.getElementById("buttons");
    buttonDiv.appendChild(button);
}

function gameLoop()
{
    // console.log(roundValue(12.31283831497134, 2));
    updateValues();
    updateUI();
}

function updateUI()
{
    for(i = 0; i < itemList.length; i++)
    {
        item = itemList[i];
        document.getElementById(item.valueID).innerHTML = item.ownedItemAmount + item.ownedItemBaseAmount;
        document.getElementById(item.buttonID).innerHTML = `<i>${item.text}</i> <b>+${buyAmount}</b> </br> ${item.nextPrice}`;
    }

    document.getElementById("valueCash").innerHTML = `Cash: ${roundValue(cash, 2)}`
}

function updateValues()
{
    var curPriorityValue = itemList.length;
    for (i = 0; i < itemList.length; i++)
    {
        var obj = itemList.find(o => o.priority === curPriorityValue)
        if(obj.priority > 1)
        {
            var previousObj = findObjectWithID(curPriorityValue - 1)
            previousObj.ownedItemAmount += roundValue((obj.baseProduction * (obj.ownedItemAmount + obj.ownedItemBaseAmount)) * (obj.multipliers + 1), 2);
        } else if (obj.priority = 1)
        {
            cash += Math.max(roundValue((obj.baseProduction * (obj.ownedItemAmount + obj.ownedItemBaseAmount)) * (obj.multipliers + 1) - (obj.baseProduction/2), 2), 0);
        } else {
            console.warn(`Object id:${obj.id} has a priority of ${obj.priority}`);
        }
        curPriorityValue--;
    }
}

function calculateItemPrice(basePrice, ratePrice, ownedItemBaseAmount)
{
    console.log(basePrice, ratePrice, ownedItemBaseAmount, buyAmount, basePrice * ((Math.pow(ratePrice, ownedItemBaseAmount) * (Math.pow(ratePrice, buyAmount) - 1)) / (ratePrice - 1)))
    return roundValue((basePrice * ((Math.pow(ratePrice, ownedItemBaseAmount) * (Math.pow(ratePrice, buyAmount) - 1)) / (ratePrice - 1))), 2);
}

function buyItem(id)
{
    var obj = findObjectWithID(id)
    if(cash >= obj.nextPrice)
    {
        cash -= obj.nextPrice;
        obj.ownedItemBaseAmount += buyAmount;
        obj.nextPrice = calculateItemPrice(obj.basePrice, obj.ratePrice, obj.ownedItemBaseAmount);
    }
    console.log("buttonClicked!", id, obj.ownedItemBaseAmount)
    updateUI();
}


setInterval(gameLoop, 1000);