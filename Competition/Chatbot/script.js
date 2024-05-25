const textDiv = document.getElementById("texts");
const sendInput = document.getElementById("selection-more-input");
const selectionMore = document.getElementById("selection-more");
const response = 
[
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam egestas convallis orci. Morbi posuere ultrices libero vel dictum. Duis vitae rhoncus orci. In sit amet turpis nec arcu venenatis luctus. Mauris auctor lacinia ante sit amet scelerisque. In quam mauris, aliquam sed dapibus sed, efficitur vel nulla. Donec nec ligula nec magna varius pulvinar eu dictum dolor. Donec mattis laoreet eros eget pulvinar. Ut at mi sodales, ornare massa eget, scelerisque mi. In magna libero, porttitor sed odio eget, ultricies fermentum risus. Cras in mollis libero. Aenean sed eros tempor, vestibulum urna semper, rutrum ante. Ut posuere aliquam elit eget placerat. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Answer 2",
    "Answer 3",
    "Answer 4"
]

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
var sendingMessage = false;

const sendMessage = async (elementNum) => {
    if (!sendingMessage) {
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
}

//Message sending
function createNewText(senderClass, text) {
    const newChildDiv = document.createElement("div")
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
    const newChildDiv = document.createElement("div")
    newChildDiv.classList.add("ai-profile");
    const newP = document.createElement("p");
    newDiv.id = "loading-bubble";
    newDiv.classList.add("text-box", "ai-text")
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
    var divs = document.querySelectorAll('.selection');
    for (var i = 0; i < divs.length; i++) {
        divs[i].classList.add('selection-disabled');
    }
}
function enableSelections() {
    sendingMessage = false;
    var divs = document.querySelectorAll('.selection');
    for (var i = 0; i < divs.length; i++) {
        divs[i].classList.remove('selection-disabled');
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
        createNewText("user-text", "Others");
        scrollDown();
        await sleep(300);
        createNewText("ai-text", "What else would you like to know?");
        scrollDown();
    } else {
        moreSelections = false;
        selectionMore.innerHTML = "Others";
        showClass(".selection");
        hideClass(".selection-more-input");
    }
}

function hideClass(className) {
    var elementsToHide = document.getElementsByClassName(className.split(".")[1]);
    for(var i = 0; i < elementsToHide.length; i++){
        elementsToHide[i].style.display = "none";
    }
}

function showClass(className) {
    var elementsToHide = document.getElementsByClassName(className.split(".")[1]);
    for(var i = 0; i < elementsToHide.length; i++){
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
        await fetch(fetchLink).then(r => r.json()).then(data => {queryData = data; return queryData;})
        answerText = queryData.items[0].htmlSnippet;
        answerText += "<br>";
        answerText += `<span>Source: <a href="${queryData.items[0].link}">${queryData.items[0].displayLink}</a></span>`;
        await sleep(300);
        createLoadingBubble();
        scrollDown();
        await sleep(1000);
        deleteLoadingBubble();
        createNewText("ai-text", answerText);
        scrollDown();
        answerText = queryData.items[1].htmlSnippet;
        answerText += "<br>";
        answerText += `<span>Source: <a href="${queryData.items[1].link}">${queryData.items[1].displayLink}</a></span>`;
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
})

