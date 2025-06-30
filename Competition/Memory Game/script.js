const cardsContainer = document.querySelector(".cards-container");
let cards = [];
let firstCard, secondCard; 
let lockBoard = false;
let score = 0;

document.querySelector(".score").textContent = score;

fetch("./cards.json")
  .then((res) => res.json())
  .then((data) => {
    cards = [...data, ...data];
    shuffleCards();
    generateCards();
  });

function shuffleCards() {
  let currentIndex = cards.length, randomIndex, tempValue;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1; 
    tempValue = cards[currentIndex];
    cards[currentIndex] = cards[randomIndex];
    cards[randomIndex] = tempValue;
  }
}

function generateCards() {
  for (let card of cards) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.setAttribute("data-name", card.name);

    if (document.querySelector(`[data-name="${card.name}"]`) === null) {
      cardElement.setAttribute("chosen-side", Math.random() < 0.5 ? "first" : "second");
    } else {
      cardElement.setAttribute("chosen-side", document.querySelector(`[data-name="${card.name}"]`).getAttribute("chosen-side") == "first" ? "second" : "first")
    }

    cardElement.style.backgroundColor = card.backgroundColor;
    cardElement.innerHTML = `
      <div class="front">
        ${card.innerHTML[cardElement.getAttribute("chosen-side")]}
      </div>
      <div class="back"></div>
    `;
    cardsContainer.appendChild(cardElement);
    cardElement.addEventListener("click", flipCard);
  }
}

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add("flipped");

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  lockBoard = true;

  checkForMatch();
}

function checkForMatch() {
  let isMatch = firstCard.dataset.name === secondCard.dataset.name;

  isMatch ? disableCards() : unflipCards(); 

  if (isMatch) score++;
  document.querySelector(".score").textContent = score;
}

function disableCards() {
  firstCard.removeEventListener("click", flipCard);
  secondCard.removeEventListener("click", flipCard);

  resetBoard();
}

function unflipCards() {
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetBoard();
  }, 1000);
}

function resetBoard() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function restart() {
  resetBoard();
  shuffleCards();
  score = 0;
  document.querySelector(".score").textContent = score;
  cardsContainer.innerHTML = "";
  generateCards();
}