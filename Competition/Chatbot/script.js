const textDiv = document.getElementById("texts")
const response = 
[
    "Answer 1",
    "Answer 2",
    "Answer 3",
    "Answer 4"
]

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
var sendingMessage = false;
// function sendMessage(elementNum) {
//     sendAsyncMessage(elementNum);
// }

const sendMessage = async (elementNum) => {
    if (!sendingMessage) {
        sendingMessage = true;
        var selectionId = "selection-";
        selectionId += elementNum;
        createNewText("user-text", document.getElementById(selectionId).innerHTML);
        await sleep(300);
        createLoadingBubble();
        await sleep(1000);
        deleteLoadingBubble();
        createNewText("ai-text", response[elementNum - 1]);
        sendingMessage = false;
    }
}


function createNewText(senderClass, text) {
    const newDiv = document.createElement("div");
    newDiv.classList.add("text-box", senderClass)
    newDiv.innerHTML = text;
    textDiv.appendChild(newDiv);
}

function createLoadingBubble() {
    const newDiv = document.createElement("div");
    newDiv.id = "loading-bubble";
    newDiv.innerHTML = "...";
    textDiv.appendChild(newDiv);
}

function deleteLoadingBubble() {
    const loadingBubble = document.getElementById("loading-bubble");
    loadingBubble.remove();
} 
