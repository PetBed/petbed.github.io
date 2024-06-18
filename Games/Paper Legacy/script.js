var data = {
  boxes: {
    credit: {
      max: 10,
      contents: [],
      paperRange: 10,
      cooldownDraw: 1000,
      cooldownRefill: 5000,
    }
  },
  currencies: {
    credit: 0
  }
}
var boxStatus = {
  credit: {
    lastPaperDrawn: 0,
    cooldownDraw: 0,
    cooldownRefill: 0
  }
}

var unshuffledNumbers = shuffledNumbers = [];
var refreshRate = 30;

for (let i = 0; i < 100 ; i++) {
  unshuffledNumbers.push(i + 1);
}

function refillBox(boxType) {
  data.boxes[boxType].contents.length = 0;
  
  shuffledNumbers = [ ...unshuffledNumbers ]
  shuffledNumbers.splice(data.boxes[boxType].paperRange, shuffledNumbers.length);

  for (let i = shuffledNumbers.length - 1; i > 0; i--) {
    const u = Math.floor(Math.random() * (i + 1));
		[shuffledNumbers[i], shuffledNumbers[u]] = [shuffledNumbers[u], shuffledNumbers[i]];
	}

  data.boxes[boxType].contents = [ ...shuffledNumbers.slice(0, data.boxes[boxType].max) ];
}
refillBox("credit");

document.getElementById("draw-paper-credit").addEventListener("click", () => {
  if (boxStatus["credit"].cooldownDraw <= 0 && boxStatus["credit"].cooldownRefill <= 0) {
    if (data.boxes["credit"].contents.length <= 0) {
      boxStatus["credit"].cooldownRefill = data.boxes["credit"].cooldownRefill;
      return;
    }
    data.currencies["credit"] += data.boxes["credit"].contents[0];
    boxStatus["credit"].lastPaperDrawn = data.boxes["credit"].contents[0];
    data.boxes["credit"].contents.shift();
    boxStatus["credit"].cooldownDraw = data.boxes["credit"].cooldownDraw;
    if (data.boxes["credit"].contents.length <= 0) boxStatus["credit"].cooldownRefill = data.boxes["credit"].cooldownRefill;
  }
});

document.getElementById("upgrade-range-credit").addEventListener("click", () => {
	
});


function updateCooldowns() {
  if (boxStatus["credit"].cooldownDraw > 0) boxStatus["credit"].cooldownDraw -= refreshRate;
  if (boxStatus["credit"].cooldownRefill > 0) {
    boxStatus["credit"].cooldownRefill -= refreshRate;
    if (boxStatus["credit"].cooldownRefill <= 0) {refillBox("credit"); boxStatus["credit"].cooldownRefill = 0}
  }
}

function draw() {
  document.getElementById("paper-left-credit").innerHTML = `Papers Left: ${data.boxes["credit"].contents.length}`;
  document.getElementById("credit-amount").innerHTML = `Credits: ${data.currencies["credit"]}`;
  document.getElementById("last-paper-drawn-credit").innerHTML = `Paper Drawn: ${boxStatus["credit"].lastPaperDrawn}`;
  document.getElementById("cooldown-time-credit").innerHTML = `Refill Cooldown: ${(boxStatus["credit"].cooldownRefill / 1000).toFixed(2)}s`;
}

var gameLoop = window.setInterval(() => {
  updateCooldowns();
  draw();
}, refreshRate)

var saveGameLoop = window.setInterval(() => {
  localStorage.setItem("paperLegacySave", JSON.stringify(data));
  console.log("Game Saved!")
}, 5000);

var savegame = JSON.parse(localStorage.getItem("paperLegacySave"))
if (savegame !== null) {
  data = savegame
  console.log("Game Loaded!")
} else {
  console.log("No Game File Found")
}

localStorage.clear();