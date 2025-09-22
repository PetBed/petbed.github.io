const paths = {
	Competition: {
		contents: {
			"Canteen System": {
				url: "https://petbed.github.io/Competition/Canteen%20System/",
			},
			Chatbot: {
				contents: {
					Chatbot: {
						url: "https://petbed.github.io/Competition/Chatbot/",
					},
					"Open Icon": {
						url: "https://petbed.github.io/Competition/Chatbot/Sub-web/",
					},
				},
			},
			Quiz: {
				url: "https://petbed.github.io/Competition/Quiz/",
			},
			"NASA Space Apps Challenge": {
				iconPath: "Competition/NASA Space Apps Challenge/Media/logo.png",
				url: "https://petbed.github.io/Competition/NASA%20Space%20Apps%20Challenge/",
			},
			"Gallery of Events & Wall of Fame": {
				url: "https://petbed.github.io/Competition/Bugcrusher%202025%20Enhancements/",
			},
			Calculator: {
				url: "https://petbed.github.io/Competition/Calculator/",
			},
			"Post Board": {
				url: "https://petbed.github.io/Competition/Post%20Board/",
			},
			"SDG News Scrapper": {
				url: "https://petbed.github.io/Competition/SDG%20News%20Scrapper/",
			},
			"Memory Game": {
				url: "https://petbed.github.io/Competition/Memory%20Game/",
			},
			"News Ticker": {
				url: "https://petbed.github.io/Competition/News%20Ticker/",
			},
		},
	},
	Games: {
		contents: {
			Prototypes: {
				contents: {
					"Exponential Game": {
						url: "https://petbed.github.io/Games/Exponential%20Game/",
					},
					G80: {
						url: "https://petbed.github.io/Games/G80/",
					},
				},
			},
			"In Development": {
				contents: {},
			},
		},
	},
	"Website Practices": {
		contents: {
			"Huddle Landing Page": {
				iconPath: "Website Practices/Huddle Landing Page/images/logo.svg",
				url: "https://petbed.github.io/Website%20Practices/Huddle%20Landing%20Page/",
			},
		},
	},
	"Personal Projects": {
		contents: {
			WoT: {
				url: "https://petbed.github.io/WoT/login/",
			},
      "Study Companion": {
        url: "https://petbed.github.io/Study%20Website/",
      },
			"Hamilton Ipsum": {
				url: "https://petbed.github.io/Misc/Hamilton%20Ipsum/",
			},
			Misc: {
				contents: {
					"Flood System Docs": {
						url: "https://petbed.github.io/Misc/Flood%20System%20Docs/",
					},
				},
			},
		},
	},
	Credits: {
		img: "Resources/credits.png",
	},
};
var currentDate, timestamp;

function closeWindow() {
  document.getElementById("folder-window").style.display = "none";
}
function selectFile(...path) {
  var selectedFileId = document.getElementsByClassName("folder-" + path.join("\/"));
	selectedFileId = selectedFileId.length > 1 ? selectedFileId[1] : selectedFileId[0];

	if (selectedFileId.classList.contains("selected")) {
		document.getElementById("folder-window").style.display = "block";
    
    var selectedFileObject = paths;
    var folderBodyEle = document.getElementById("window-body");

		for (i in path) {
      if ("contents" in selectedFileObject[path[i]]) {
        selectedFileObject = selectedFileObject[path[i]].contents
      } else {
        "url" in selectedFileObject[path[i]] ? window.open(selectedFileObject[path[i]].url) : folderBodyEle.innerHTML = `<img src="${selectedFileObject[path[i]].img}">`;
        return;
      }
		}
    document.getElementById("folder-path").innerHTML = path.join("/");
    
    folderBodyEle.innerHTML = ""; 
    for (i in Object.keys(selectedFileObject)) {
      var objectKey = Object.keys(selectedFileObject)[i];
      console.log(selectedFileObject)
      folderBodyEle.innerHTML += `
        <div class="folder folder-${path.join("/") + "/" + objectKey}" onclick="selectFile('${path.join("', '")}', '${objectKey}')">
          <img src="${"iconPath" in selectedFileObject[objectKey] ? selectedFileObject[objectKey].iconPath : `Resources/${"url" in selectedFileObject[objectKey] ? "default icon" : "folder"}.png`}" alt="">
          <p>${objectKey}</p>
        </div>
      `;
		}
    if (path.length > 1) {
      path.pop();
      folderBodyEle.innerHTML += `
      <div class="folder back-btn folder-${path.join("/")}" onclick="selectFile('${path.join("', '")}')">
      <img src="Resources/folder.png" alt="">
      <p>.../</p>
      </div>
      `;
    }

	} else {
		try {
			document.getElementsByClassName("selected")[0].classList.remove("selected");
		} catch {
			console.warn("There were no selected folders to remove");
		} finally {
      if (selectedFileId.classList.contains("back-btn"));
			selectedFileId.classList.add("selected");
		}
	}
}

function getTime() {
	const time = document.getElementById("time");
	currentDate = new Date();
  var hours = currentDate.getHours();
  var minutes = currentDate.getMinutes();
  var seconds = currentDate.getSeconds();

	if (currentDate.getHours() - 10 < 0) {
		time.innerHTML = "0" + currentDate.getHours();
	} else {
		time.innerHTML = currentDate.getHours();
	}
	time.innerHTML += `:${currentDate.getMinutes()}:`;
	if (currentDate.getSeconds() - 10 < 0) {
		time.innerHTML += "0" + currentDate.getSeconds();
	} else {
		time.innerHTML += currentDate.getSeconds();
	}

  time.innerHTML = `${hours - 10 < 0 ? "0" + hours : hours}:${minutes - 10 < 0 ? "0" + minutes : minutes}:${seconds - 10 < 0 ? "0" + seconds : seconds}`;
}

setInterval(() => {
	getTime();
}, 50);
