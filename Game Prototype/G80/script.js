const moneyText = document.getElementById("money");
const happinessText = document.getElementById("happiness");
const taxesText = document.getElementById("taxes");
const numberInput = document.getElementById("typeInput");

const moneyID = 0;
const taxesID = 1;
const happinessID = 2;

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const items = [
	{
		title: "Money",
		baseValue: 10,
		modifiers: 0,
		value: 10,
		ratios: [
			{title: "Money", ratio: 0, type: ""},
			{title: "Taxes", ratio: 0.3, type: "Base"},
			{title: "Happiness", ratio: 0.2, type: "Modifier"},
		],
	},
	{
		title: "Taxes",
		baseValue: 0,
		modifiers: 0,
		value: 0,
		ratios: [
			{title: "Money", ratio: -0.5, type: "Modifier"},
			{title: "Taxes", ratio: 0, type: ""},
			{title: "Happiness", ratio: 0, type: ""},
		],
	},
	{
		title: "Happiness",
		baseValue: 0,
		modifiers: 0,
		value: 0,
		ratios: [
			{title: "Money", ratio: 0, type: ""},
			{title: "Taxes", ratio: 0, type: ""},
			{title: "Happiness", ratio: 0, type: ""},
		],
	},
];

function updateDisplay(id) {
	return `${items[id].title}: ${items[id].value}`;
}

function loop() {
	moneyText.innerHTML = updateDisplay(moneyID);
	happinessText.innerHTML = updateDisplay(happinessID);
	taxesText.innerHTML = updateDisplay(taxesID);

	setModifiers();
	updateValues();
}

function setModifiers() {
	for (let i = 0; i < items.length; i++) {
		const curItem = items[i];

		for (let j = 0; j < curItem.ratios.length; j++) {
			const curRatio = curItem.ratios[j];

			if (curRatio.ratio !== 0) {
				if (curRatio.type === "Base") {
					items[j].baseValue = clamp(Math.round(curItem.value * curRatio.ratio * 100) / 100, 0, 100);
				} else if (curRatio.type === "Modifier") {
					items[j].modifiers = Math.round(curItem.value * curRatio.ratio * 100) / 100;
				}
			}
		}
	}
}

function updateValues() {
	for (let i = 0; i < items.length; i++) {
		const curItem = items[i];
		curItem.value = clamp(Math.round((curItem.baseValue + curItem.modifiers) * 100) / 100, 0, 100);
	}
}

function buttonClicked(id) {
	items[id].baseValue = clamp(+numberInput.value, 0, 100);
}

setInterval(loop, 50);
