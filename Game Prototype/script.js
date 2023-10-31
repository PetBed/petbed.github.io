var cash = 0, buyAmount = 1;
var itemList = [];

createNewItem(1, 1, "Item 1", 1, 2, 1.2);
createNewItem(2, 1, "Item 2", 2, 5, 1.45);
createNewItem(3, 1, "Item 3", 3, 10, 1.7);


function createNewItem(itemID, value, buttonText, priority, basePrice, ratePrice)
{
    var obj = {};
    obj.id = itemID;
    obj.valueID = "value"+itemID;
    obj.buttonID = "button"+itemID;
    obj.text = buttonText;
    obj.basePrice = basePrice;
    obj.nextPrice = 0;
    obj.ratePrice = ratePrice;
    obj.ownedItemBaseAmount = value
    obj.ownedItemAmount = value;
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
    const buttonDiv = document.getElementById("buttons");
    buttonDiv.appendChild(button);
}

function gameLoop()
{
    // console.log(itemList);
    updateValues();
    updateUI();
}

function updateUI()
{
    for(i = 0; i < itemList.length; i++)
    {
        item = itemList[i];
        document.getElementById(item.valueID).innerHTML = item.ownedItemAmount;
        document.getElementById(item.buttonID).innerHTML = `<i>${item.text}</i> <b>+${buyAmount}</b> </br> ${item.nextPrice}`;
    }

    document.getElementById("valueCash").innerHTML = `Cash: ${cash}`
}

function updateValues()
{
    var curPriorityValue = itemList.length;
    for (i = 0; i < itemList.length; i++)
    {
        var obj = itemList.find(o => o.priority === curPriorityValue)
        calculateNextPrice(obj);
        if(obj.priority > 1)
        {
            var previousObj = itemList.find(o => o.priority === curPriorityValue - 1)
            previousObj.ownedItemAmount += (obj.baseProduction * obj.ownedItemAmount) * (obj.multipliers + 1);
        } else if (obj.priority = 1)
        {
            cash += (obj.baseProduction * obj.ownedItemAmount) * (obj.multipliers + 1);
        } else {
            console.warn(`Object id:${obj.id} has a priority of ${obj.priority}`);
        }
        curPriorityValue--;
    }
}

function calculateNextPrice(item)
{
    item.nextPrice = item.basePrice * Math.pow(item.ratePrice, item.ownedItemBaseAmount)
    // console.log(item.basePrice, item.ratePrice, item.ownedItemBaseAmount)
    // console.log(item.nextPrice)
}

setInterval(gameLoop, 1000);