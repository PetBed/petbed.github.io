var data = {
  boxes: {
    main: {
      max: 10,
      contents: []
    }
  }
}
var unshuffledNumbers = [], shuffledNumbers = []; 
for (let i = 0; i < 100 ; i++) {
  unshuffledNumbers.push(i + 1);
}

const boxes = data.boxes
function refillBox(boxType) {
  boxes[boxType].contents.length = 0;
  
  shuffledNumbers = [ ...unshuffledNumbers ]
  
  for (let i = shuffledNumbers.length - 1; i > 0; i--) {
    const u = Math.floor(Math.random() * (i + 1));
		[shuffledNumbers[i], shuffledNumbers[u]] = [shuffledNumbers[u], shuffledNumbers[i]];
	}

  boxes[boxType].contents = [ ...shuffledNumbers.slice(0, boxes[boxType].max) ];
  console.log(boxes[boxType].contents);
}
refillBox("main");