const textDiv = document.getElementById("texts");
const selections = document.getElementById("selections");
const sendInput = document.getElementById("selection-more-input");
const header = document.getElementById("header");
const selectionMore = document.getElementById("selection-more");
const response = [
	"Road accidents commonly occur due to several factors. Distracted driving, such as texting or using a phone, diverts attention from the road and increases the chance of collisions. Speeding reduces the time to react to unexpected situations and makes crashes more severe. Impaired driving, whether due to alcohol or drugs, decreases a driver’s ability to make safe decisions. Poor weather conditions like rain, snow, or fog can lead to reduced visibility and slippery roads. Bad road conditions, such as potholes or missing signs, also contribute to accidents. Additionally, driver fatigue and aggressive driving behaviors significantly raise the risk of accidents.",
	"Road accidents generally occur on weekends, particularly Friday and Saturday nights. Data shows a higher number of accidents due to increased social activities and higher instances of impaired driving. During the week, rush hours between 7-9AM and 4-6PM are peak times for accidents, as there is a higher volume of traffic and more hurried driving behavior. Additionally, holidays and long weekends often see a spike in accidents due to increased travel and celebrations that may involve alcohol consumption. Weather conditions and daylight hours also play a role, with accidents more common during poor weather and at times of reduced visibility, such as dawn and dusk.",
	"Unfavorable weather conditions create wet or icy roads that decreases tyre grip and makes it more difficult to maneuver safely. Fog, heavy rain, and snowstorms reduce visibility, making it harder for drivers to see other vehicles, road signs, and obstacles, which can lead to collisions. Severe weather conditions often cause drivers to overestimate their abilities or underestimate the dangers, leading to more reckless driving behaviors. Additionally, poor weather can lead to an increase in multi-vehicle pile-ups due to the reduced ability to stop in time, thus increasing the severity of accidents.",
	"Distracted driving can be caused by a variety of activities and elements that divert attention from the road: <br><br> 1. Mobile phones – Texting, calling, or using apps can take a driver's eyes off the road and hands off the wheel. <br><br> 2. In-Car Technology – GPS devices, infotainment systems, and other electronic controls can divert a driver's attention away from the road <br><br> 3. Eating and drinking while driving – Requires physical and cognitive attention that should be focused on the road <br><br> 4. External factors – E.g. billboards, roadside accidents, or other activities can catch a driver's eye, leading to dangerous lapses in attention",
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
