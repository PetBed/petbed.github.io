var data = {
  boxes: {
    credit: {
      size: 10,
      sizeCostBase: 100,
      sizeCostGrowth: 1.07,
      contents: [],
      paperRange: 10,
      cooldownDraw: 30,
      cooldownRefill: 500,
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

var unshuffledNumbers = shuffledNumbers = numberRange = [];
var refreshRate = 30;

for (let i = 0; i < 100 ; i++) {
  unshuffledNumbers.push(i + 1);
}

function refillBox(boxType) {
  data.boxes[boxType].contents.length = 0;
  shuffledNumbers = [];
  
  numberRange = [ ...unshuffledNumbers ]
  numberRange.splice(data.boxes[boxType].paperRange, numberRange.length);
  console.log(numberRange)

  for (i = 0; i < Math.ceil(data.boxes["credit"].size / data.boxes["credit"].paperRange); i++) {
    shuffledNumbers.push( ...numberRange );
  }

  for (let i = shuffledNumbers.length - 1; i > 0; i--) {
    const u = Math.floor(Math.random() * (i + 1));
		[shuffledNumbers[i], shuffledNumbers[u]] = [shuffledNumbers[u], shuffledNumbers[i]];
	}

  data.boxes[boxType].contents = [ ...shuffledNumbers.slice(0, data.boxes[boxType].size) ];
  console.log(data.boxes["credit"].contents)
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
	if (data.currencies.credit >= (data.boxes["credit"].paperRange - 9) * 50) {
    data.currencies.credit -= (data.boxes["credit"].paperRange - 9) * 50;
    data.boxes["credit"].paperRange += 1;
  }
});

document.getElementById("upgrade-size-credit").addEventListener("click", () => {
  if (data.currencies.credit >= data.boxes["credit"].sizeCostBase * Math.pow(data.boxes["credit"].sizeCostGrowth, data.boxes["credit"].size - 10)) {
    data.currencies.credit -= (data.boxes["credit"].sizeCostBase * Math.pow(data.boxes["credit"].sizeCostGrowth, data.boxes["credit"].size - 10)).toFixed(2);
    data.boxes["credit"].size += 1;
  }
})


function updateCooldowns() {
  if (boxStatus["credit"].cooldownDraw > 0) boxStatus["credit"].cooldownDraw -= refreshRate;
  if (boxStatus["credit"].cooldownRefill > 0) {
    boxStatus["credit"].cooldownRefill -= refreshRate;
    if (boxStatus["credit"].cooldownRefill <= 0) {refillBox("credit"); boxStatus["credit"].cooldownRefill = 0}
  }
}

function draw() {
  document.getElementById("credit-amount").innerHTML = `Credits: ${data.currencies["credit"].toFixed(2)}`;
  document.getElementById("paper-left-credit").innerHTML = `Papers Left: ${data.boxes["credit"].contents.length}`;
  document.getElementById("last-paper-drawn-credit").innerHTML = `Paper Drawn: ${boxStatus["credit"].lastPaperDrawn}`;
  document.getElementById("cooldown-time-credit").innerHTML = `Refill Cooldown: ${(boxStatus["credit"].cooldownRefill / 1000).toFixed(2)}s`;
  document.getElementById("box-size-credit").innerHTML = `Box Size: ${data.boxes["credit"].size}`;
  document.getElementById("paper-range-credit").innerHTML = `Paper Range: 1 - ${(data.boxes["credit"].paperRange)}`;

  document.getElementById("upgrade-range-credit").innerHTML = `Upgrade Paper Range (${(data.boxes["credit"].paperRange - 9) * 50} Credits)`;
  document.getElementById("upgrade-size-credit").innerHTML = `Upgrade Box Size (${(data.boxes["credit"].sizeCostBase * Math.pow(data.boxes["credit"].sizeCostGrowth, data.boxes["credit"].size - 10)).toFixed(2)} Credits)`;
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