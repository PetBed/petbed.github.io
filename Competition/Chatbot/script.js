const textDiv = document.getElementById("texts");
const selections = document.getElementById("selections");
const sendInput = document.getElementById("selection-more-input");
const header = document.getElementById("header");
const selectionMore = document.getElementById("selection-more");
const response = [
	"Generating energy that produces no greenhouse gas emissions from fossil fuels and reduces some types of air pollution. Diversifying energy supply and reducing dependence on imported fuels. Creating economic development and jobs in manufacturing, installation, and more.",
	"Renewable energy sources like wind, solar, and hydropower generate electricity without emitting greenhouse gases, unlike fossil fuels such as coal and natural gas. This helps mitigate climate change by reducing carbon dioxide and other harmful emissions.",
	"Malaysia leverages its abundant natural resources to harness various renewable energy sources, primarily solar, biomass, biogas, and hydropower. The country benefits from high solar radiation, leading to widespread adoption of solar photovoltaic systems and large-scale solar projects. Biomass energy is generated from agricultural and forestry residues, especially from the palm oil industry, while biogas is produced from palm oil mill effluent and livestock waste, capturing methane for energy use. Hydropower, especially from large plants in Sarawak, also plays a crucial role. These renewable sources are part of Malaysia's strategy to reduce reliance on fossil fuels and promote sustainable energy development.",
	"Renewable energy is derived from natural processes that are continually replenished, making it a sustainable and environmentally friendly alternative to fossil fuels. The primary sources of renewable energy include sunlight (solar energy), wind, rain (hydropower), tides, waves, and geothermal heat. Unlike fossil fuels, which are finite and produce harmful emissions, renewable energy sources produce little to no pollution and have a minimal impact on the environment. They play a crucial role in reducing greenhouse gas emissions, combating climate change, enhancing energy security, and providing economic and social benefits by creating jobs and supporting rural development.",
];

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
var sendingMessage = false;
var moreSelectionsJustClicked = false;

const sendMessage = async (elementNum) => {
	if (!sendingMessage) {
    moreSelectionsJustClicked = false;
		disableSelections();
		var selectionId = "selection-";
		selectionId += elementNum;
		createNewText("user-text", document.getElementById(selectionId).innerHTML);
		scrollDown();
		await sleep(300);
		createLoadingBubble();
		scrollDown();
		await sleep(500);
		deleteLoadingBubble();
		createNewText("ai-text", response[elementNum - 1]);
		scrollDown();
		enableSelections();
	}
};

//Message sending
function createNewText(senderClass, text) {
	const newChildDiv = document.createElement("div");
	if (senderClass == "user-text") {
		newChildDiv.classList.add("user-profile");
	} else {
		newChildDiv.classList.add("ai-profile");
	}
	const newDiv = document.createElement("div");
	const newP = document.createElement("p");
	newDiv.classList.add("text-box", senderClass);
	newP.innerHTML = text;
	newDiv.appendChild(newChildDiv);
	newDiv.appendChild(newP);
	textDiv.appendChild(newDiv);
}

function createLoadingBubble() {
	const newDiv = document.createElement("div");
	const newChildDiv = document.createElement("div");
	newChildDiv.classList.add("ai-profile");
	const newP = document.createElement("p");
	newDiv.id = "loading-bubble";
	newDiv.classList.add("text-box", "ai-text");
	newP.innerHTML = "...";
	newDiv.appendChild(newChildDiv);
	newDiv.appendChild(newP);
	textDiv.appendChild(newDiv);
}
function deleteLoadingBubble() {
	const loadingBubble = document.getElementById("loading-bubble");
	loadingBubble.remove();
}

function disableSelections() {
	sendingMessage = true;
	var divs = document.querySelectorAll(".selection");
	for (var i = 0; i < divs.length; i++) {
		divs[i].classList.add("selection-disabled");
	}
}
function enableSelections() {
	sendingMessage = false;
	var divs = document.querySelectorAll(".selection");
	for (var i = 0; i < divs.length; i++) {
		divs[i].classList.remove("selection-disabled");
	}
}

function scrollDown() {
	const newDiv = document.createElement("div");
	newDiv.id = "scroll-down";
	textDiv.appendChild(newDiv);
	const scrollDownDiv = document.getElementById("scroll-down");
	scrollDownDiv.scrollIntoView();
	scrollDownDiv.remove();
}

//More functions
var moreSelections = false;
async function openMore() {
	if (!moreSelections) {
		moreSelections = true;
		selectionMore.innerHTML = "Back";
		hideClass(".selection");
		showClass(".selection-more-input");
    console.log(moreSelectionsJustClicked)
    if (!moreSelectionsJustClicked) {
      createNewText("user-text", "Others");
      scrollDown();
      await sleep(300);
      createNewText("ai-text", "What else would you like to know?");
      scrollDown();
      moreSelectionsJustClicked = true;
    }
	} else {
		moreSelections = false;
		selectionMore.innerHTML = "Others";
		showClass(".selection");
		hideClass(".selection-more-input");
	}
}

function hideClass(className) {
	var elementsToHide = document.getElementsByClassName(className.split(".")[1]);
	for (var i = 0; i < elementsToHide.length; i++) {
		elementsToHide[i].style.display = "none";
	}
}

function showClass(className) {
	var elementsToHide = document.getElementsByClassName(className.split(".")[1]);
	for (var i = 0; i < elementsToHide.length; i++) {
		elementsToHide[i].style.display = "flex";
	}
}

async function sendQuery() {
	if (sendInput.value != "" && !sendingMessage) {
		sendingMessage = true;
		var fetchLink = "https://www.googleapis.com/customsearch/v1?key=AIzaSyCzCnB_E-ZDAaoEQ5s7ucHTazlMYr1g56E&cx=d1f9b0939f4e34e35&format=js&q=what%20is%20";
		var queryData, answerText;
		fetchLink += sendInput.value.replace(" ", "%20");
		createNewText("user-text", sendInput.value);
		scrollDown();
		sendInput.value = "";
		await sleep(300);
		createLoadingBubble();
		scrollDown();
		await sleep(300);
		deleteLoadingBubble();
		createNewText("ai-text", "Here's what I found:");
		scrollDown();
		await fetch(fetchLink)
			.then((r) => r.json())
			.then((data) => {
				queryData = data;
				return queryData;
			});
		answerText = queryData.items[0].htmlSnippet;
		answerText += "<br>";
		answerText += `<span>Source: <a href="${queryData.items[0].link}" target="_blank">${queryData.items[0].displayLink}</a></span>`;
		await sleep(300);
		createLoadingBubble();
		scrollDown();
		await sleep(1000);
		deleteLoadingBubble();
		createNewText("ai-text", answerText);
		scrollDown();
		answerText = queryData.items[1].htmlSnippet;
		answerText += "<br>";
		answerText += `<span>Source: <a href="${queryData.items[1].link} target="_blank">${queryData.items[1].displayLink}</a></span>`;
		await sleep(300);
		createLoadingBubble();
		scrollDown();
		await sleep(700);
		deleteLoadingBubble();
		createNewText("ai-text", answerText);
		scrollDown();
		sendingMessage = false;
	}
}

sendInput.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		sendQuery();
	}
});

setInterval(() => {
	// console.log(document.getElementsByClassName("selections")[0])
	// console.log(document.getElementById("texts").style.height);
	// document.getElementById("texts").style.height = "20px";
	// console.log(window.innerHeight - document.getElementsByClassName("selections")[0].offsetHeight - document.getElementById("header").offsetHeight);
	// console.log(Math.max(document.documentElement.clientHeight, window.innerHeight || 0))
	document.getElementById("texts").style.height = window.innerHeight - document.getElementsByClassName("selections")[0].offsetHeight - document.getElementById("header").offsetHeight + "px";
}, 20);
