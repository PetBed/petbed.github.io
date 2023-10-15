const moneyText = document.getElementById("money");
const happinessText = document.getElementById("happiness");
const corruptionText = document.getElementById("corruption");
const numberInput = document.getElementById("typeInput");

var moneyID = 0, corruptionID = 1, happinessID = 2;
var items = 
[
    {
        title: "Money",
        baseValue: 10,
        modifiers: 0,
        value: 10,
        ratios: 
        [
            {
                title: "Money",
                ratio: 0,
                type: ""
            },
            {
                title: "Corruption",
                ratio: .3,
                type: "Base"
            },
            {
                title: "Happiness",
                ratio: .2,
                type: "Modifier"
            }
        ]
    },
    {
        title: "Corruption",
        baseValue: 1,
        modifiers: 0,
        value: 0,
        ratios: 
        [
            {
                title: "Money",
                ratio: -.5,
                type: "Modifier"
            },
            {
                title: "Corruption",
                ratio: 0,
                type: ""
            },
            {
                title: "Happiness",
                ratio: 0,
                type: ""
            }
        ]
    },
    {
        title: "Happiness",
        baseValue: 0,
        modifiers: 0,
        value: 0,
        ratios: 
        [
            {
                title: "Money",
                ratio: 0,
                type: ""
            },
            {
                title: "Corruption",
                ratio: 0,
                type: ""
            },
            {
                title: "Happiness",
                ratio: 0,
                type: ""
            }
        ]
    }
];

function loop()
{
    moneyText.innerHTML = `${items[moneyID].title}: ${items[moneyID].value}`;
    happinessText.innerHTML = `${items[happinessID].title}: ${items[happinessID].value}`;
    corruptionText.innerHTML = `${items[corruptionID].title}: ${items[corruptionID].value}`;

    setModifiers();
    updateValues();
}

function setModifiers()
{
    for(i = 0; i < items.length; i++)
    {
        var curItem = items[i];

        for(j = 0; j < curItem.ratios.length; j++)
        {
            var curRatio = curItem.ratios[j];

            if(curRatio.ratio != 0)
            {
                if(curRatio.type == "Base")
                {
                    items[j].baseValue = Math.round(curItem.value * curRatio.ratio * 100) / 100;
                } else if(curRatio.type == "Modifier") {
                    items[j].modifiers = Math.round(curItem.value * curRatio.ratio * 100) / 100;
                } else {
                    console.log("Not base nur modifier!");
                }
            }
        }
    }
}

function updateValues()
{
    for(i = 0; i < items.length; i++)
    {
        var curItem = items[i]
        curItem.value = Math.round((curItem.baseValue + curItem.modifiers) * 100) / 100;
        console.log(items[i])
    }
}

function buttonClicked(id)
{
    console.log(items[id].baseValue, +numberInput.value, id)
    items[id].baseValue = +numberInput.value
}

setInterval(loop, 50);