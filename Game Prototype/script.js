const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const findObjectWithID = (objectID) => itemList.find(o => o.priority === objectID)
const roundValue = (value, decimalPoints) => Math.floor(value * Math.pow(10, decimalPoints)) / Math.pow(10, decimalPoints)

var cash = 0, buyAmount = 1;
var itemList = [];

createNewItem(1, 24, "Item 1", 1, 10, 1.05);
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
    obj.multipliers = 1;
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

    const buyMaxButton = document.createElement("button");
    buyMaxButton.setAttribute("id", "buymax" + obj.buttonID);
    buyMaxButton.onclick = function() {buyMaxItem(itemID)};
    buyMaxButton.innerHTML = "Buy Max"
    const buyMaxButtonDiv = document.getElementById("buyMaxButtons");
    buyMaxButtonDiv.appendChild(buyMaxButton);
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
        document.getElementById(item.valueID).innerHTML = `${item.ownedItemAmount + item.ownedItemBaseAmount} (${item.ownedItemBaseAmount}) <i>x${item.multipliers}</i>`;
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
            previousObj.ownedItemAmount += roundValue((obj.baseProduction * (obj.ownedItemAmount + obj.ownedItemBaseAmount)) * obj.multipliers, 2);
        } else if (obj.priority = 1)
        {
            cash += Math.max(roundValue((obj.baseProduction * (obj.ownedItemAmount + obj.ownedItemBaseAmount)) * obj.multipliers - (obj.baseProduction/2), 2), 0);
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

    obj.multipliers = 1;
    console.log(Math.floor(obj.ownedItemBaseAmount / 25))
    for (i = 0; i < Math.floor(obj.ownedItemBaseAmount / 25); i++)
    {
        obj.multipliers = obj.multipliers * 2;
    }
    updateUI();
}

function buyMaxItem(id)
{
    var obj = findObjectWithID(id)

    var maxBuyAmount = Math.floor((Math.log((cash * (obj.ratePrice - 1)) / (obj.basePrice * Math.pow(obj.ratePrice, obj.ownedItemBaseAmount)) + 1)) / (Math.log(obj.ratePrice)))
    console.log(maxBuyAmount);
    
    buyAmount = maxBuyAmount
    obj.nextPrice = calculateItemPrice(obj.basePrice, obj.ratePrice, obj.ownedItemBaseAmount);
    buyItem(id);
    buyAmount = 1;
    // for (i = 0; i < maxBuyAmount; i++)
    // {
        // buyItem(id);
    // }
}

setInterval(gameLoop, 1000);