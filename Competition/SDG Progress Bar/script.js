var data = {};
// await fetch('http://localhost:3005/api/sdgnews') //https://wot-tau.vercel.app/api/sdgnews
//     .then(response => response.json()) // Parse JSON
//     .then((json) => {
//         data = json;
//     }) // Work with JSON data
//     .catch(error => console.error('Error fetching JSON:', error));

// function generateNews() {
//   const newsContainer = document.getElementById("news-container");
//   const newsData = data.allNews;
//   console.log(newsData);
//   newsData.forEach((item) => {
//     const newsDiv = document.createElement("div");
//     const newsImageLink = document.createElement("a");
//     const newsImage = document.createElement("img");
//     const newsBody = document.createElement("div");
//     const newsBodyLink = document.createElement("a");
//     const newsDate = document.createElement("span");
//     const newsTitle = document.createElement("h3");
//     const newsDesc = document.createElement("p");
//     const newsSDG = document.createElement("div");
//     const newsSDGText = document.createElement("span");
//     const newsSDGListContainer = document.createElement("div");

//     newsDiv.classList.add("news-item");
//     newsImageLink.classList.add("news-image");
//     newsBody.classList.add("news-body");
//     newsBodyLink.classList.add("news-body-info");
//     newsSDG.classList.add("news-sdgs");

//     newsImage.src = item.image;
//     newsTitle.innerHTML = item.title;
//     newsDate.innerHTML = item.date;
//     newsDesc.innerHTML = item.summary;
//     newsSDGText.innerHTML = "Related SDGS";
//     item.goals.forEach(element => {
//       const newsSDGItem = document.createElement("a");
//       newsSDGItem.innerHTML = element;  
//       newsSDGItem.href = `https://sdgs.un.org/goals/goal${element}`;

//       function getBackgroundColor(n) {
//         switch (n) {
//           case "1":
//             return "#e5233d"
//           case "2":
//             return "#dda73a"
//           case "3":
//             return "#4ca146"
//           case "4":
//             return "#c5192d"
//           case "5":
//             return "#ef402c"
//           case "6":
//             return "#27bfe6"
//           case "7":
//             return "#fbc412"
//           case "8":
//             return "#a31c44"
//           case "9":
//             return "#f26a2d"
//           case "10":
//             return "#e01483"
//           case "11":
//             return "#f89d2a"
//           case "12":
//             return "#bf8d2c"
//           case "13":
//             return "#407f46"
//           case "14":
//             return "#1f97d4"
//           case "15":
//             return "#59ba48"
//           case "16":
//             return "#126a9f"
//           case "17":
//             return "#13496b"
//         }
//       }
//       newsSDGItem.style.backgroundColor = getBackgroundColor(element);
//       newsSDGListContainer.appendChild(newsSDGItem);
//     });

//     newsImageLink.href = item.link;
//     newsBodyLink.href = item.link;

//     newsImageLink.appendChild(newsImage);

//     newsBodyLink.appendChild(newsDate);
//     newsBodyLink.appendChild(newsTitle);
//     newsBodyLink.appendChild(newsDesc);

//     newsSDG.appendChild(newsSDGText);
//     newsSDG.appendChild(newsSDGListContainer);
    
//     newsBody.appendChild(newsBodyLink);
//     newsBody.appendChild(newsSDG);
//     newsDiv.appendChild(newsImageLink);
//     newsDiv.appendChild(newsBody);

//     newsContainer.appendChild(newsDiv);
//   })


// }

function indexOfMax(arr, prop) {
  return arr.reduce(
      (maxIndex, current, currentIndex, array) => {
          return current[prop] > 
          array[maxIndex][prop] ? currentIndex : 
          maxIndex;
  }, 0);
}

async function setProgressBar() {
  var progressData;
  await fetch('./malaysiaSDGData 3.json')
    .then(response => response.json())
    .then((json) => {
      progressData = json.data
    }).catch(error => console.error('Error fetch9ng JSON:', error));
  var filteredData = progressData.filter(function (el) {
    return el.indicator.includes("3.4.2");
  });
  console.log(progressData);
  console.log(filteredData);

  console.log(filteredData[indexOfMax(filteredData, "timePeriodStart")])

  var bar = document.getElementById("bar")
  var width = 50;
  bar.style.width = width + "%"
}


setProgressBar();
generateNews();