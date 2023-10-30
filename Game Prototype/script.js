var cash = 0;
var itemList = [];

createNewItem(1, 1);
createNewItem(2, 2);
createNewItem(3, 3);


function createNewItem(itemID, value)
{
    var obj = {};
    obj.id = itemID;
    obj.value = value;
    obj.valueID = "value"+itemID;
    obj.buttonID = "button"+itemID;
    
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
    console.log(itemList);
    updateUI();
}

function updateUI()
{
    for(i = 0; i < itemList.length; i++)
    {
        item = itemList[i];
        document.getElementById(item.valueID).innerHTML = item.value;
    }
}

setInterval(gameLoop, 1000);