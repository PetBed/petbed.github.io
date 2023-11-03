const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const findObjectWithID = (objectID) => itemList.find(o => o.priority === objectID)
const roundValue = (value, decimalPoints) => Math.floor(value * Math.pow(10, decimalPoints)) / Math.pow(10, decimalPoints)
const outputAsFormatted = (number) =>   {
                                            if (number < 1000) return number.toString();

                                            let log = Math.log10(number);
                                            let div = log - log % 3;
                                            let index = div / 3;
                                            while (index >= valueMap.length) {
                                                // ran out of map elements
                                                index -= 1;
                                                div -= 3;
                                            }
                                            return (number / Math.pow(10, div)).toPrecision(6) + " " + valueMap[index];
                                        };

const valueMap = ["", "K", "M", "B", "T"];
createValueMap();

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
    obj.nextPrice = calculateItemPrice(obj.basePrice, obj.ratePrice, obj.ownedItemBaseAmount, -1);
    obj.maxBuyAmount = 0;
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
    button.onclick = function() {buyItem(itemID, -1)};
    const buttonDiv = document.getElementById("buttons");
    buttonDiv.appendChild(button);

    const buyMaxButton = document.createElement("button");
    buyMaxButton.setAttribute("id", "buymax" + obj.buttonID);
    buyMaxButton.onclick = function() {buyMaxItem(itemID)};
    buyMaxButton.innerHTML = "Buy Max"
    const buyMaxButtonDiv = document.getElementById("buyMaxButtons");
    buyMaxButtonDiv.appendChild(buyMaxButton);
}

function createValueMap()
{
    const letterMap = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
    var letter1 = 1
    var letter2 = 1
    var word = "AA"
    do 
    {
        word = letterMap[letter2 - 1] + letterMap[letter1 - 1]

        letter1 += 1;
        if (letter1 > 26)
        {
            letter1 = 1;
            letter2 += 1;
        }
        valueMap.push(word)
    }
    while (letter1 != 27 && letter2 != 27);
    console.log(valueMap);
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
        document.getElementById(item.valueID).innerHTML = `${outputAsFormatted(item.ownedItemAmount + item.ownedItemBaseAmount)} <b>(${item.ownedItemBaseAmount})</b> <i>x${outputAsFormatted(item.multipliers)}</i>`;
        document.getElementById(item.buttonID).innerHTML = `<i>${item.text}</i> <b>+${buyAmount}</b> </br> ${outputAsFormatted(item.nextPrice)}`;
        document.getElementById("buymax" + item.buttonID).innerHTML = `Buy Max <i>+${item.maxBuyAmount}</i>`
    }

    document.getElementById("valueCash").innerHTML = `Cash: ${outputAsFormatted(roundValue(cash, 2))}`
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

        obj.maxBuyAmount = Math.floor((Math.log((cash * (obj.ratePrice - 1)) / (obj.basePrice * Math.pow(obj.ratePrice, obj.ownedItemBaseAmount)) + 1)) / (Math.log(obj.ratePrice)))
        curPriorityValue--;
    }
}

function calculateItemPrice(basePrice, ratePrice, ownedItemBaseAmount, amount)
{
    // console.log(basePrice, ratePrice, ownedItemBaseAmount, buyAmount, basePrice * ((Math.pow(ratePrice, ownedItemBaseAmount) * (Math.pow(ratePrice, buyAmount) - 1)) / (ratePrice - 1)))
    if (amount == -1)
    {
        return roundValue((basePrice * ((Math.pow(ratePrice, ownedItemBaseAmount) * (Math.pow(ratePrice, buyAmount) - 1)) / (ratePrice - 1))), 2);
    } else {
        return roundValue((basePrice * ((Math.pow(ratePrice, ownedItemBaseAmount) * (Math.pow(ratePrice, amount) - 1)) / (ratePrice - 1))), 2);
    }
}

function buyItem(id, amount)
{
    var obj = findObjectWithID(id)

    obj.nextPrice = calculateItemPrice(obj.basePrice, obj.ratePrice, obj.ownedItemBaseAmount, amount);

    if(cash >= obj.nextPrice)
    {
        cash -= obj.nextPrice;
        if (amount == -1)
        {
            obj.ownedItemBaseAmount += buyAmount;
        } else {
            obj.ownedItemBaseAmount += amount
        }
    }

    // console.log("buttonClicked!", id, obj.ownedItemBaseAmount);

    obj.nextPrice = calculateItemPrice(obj.basePrice, obj.ratePrice, obj.ownedItemBaseAmount, buyAmount);

    obj.multipliers = 1;
    // console.log(Math.floor(obj.ownedItemBaseAmount / 25));
    for (i = 0; i < Math.floor(obj.ownedItemBaseAmount / 25); i++)
    {
        obj.multipliers = obj.multipliers * 2;
    }
    updateUI();
}

function buyMaxItem(id)
{
    var obj = findObjectWithID(id)
    buyItem(id, obj.maxBuyAmount)

    var curPriorityValue = itemList.length;
    for (i = 0; i < itemList.length; i++)
    {
        var item = itemList.find(o => o.priority === curPriorityValue)
        
        item.maxBuyAmount = Math.floor((Math.log((cash * (item.ratePrice - 1)) / (item.basePrice * Math.pow(item.ratePrice, item.ownedItemBaseAmount)) + 1)) / (Math.log(item.ratePrice)))
        curPriorityValue--;
    }    
    updateUI();
}

setInterval(gameLoop, 1000);