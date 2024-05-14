    const questions = [
    {
        question: "How many types of road signs are there in Malayasia?",
        answers: [
            { text: "4", correct: false }, 
            { text: "5", correct: true}, 
            { text: "2", correct: false}, 
            { text: "3", correct: false}
        ]
    },
    {
        question: "Which is a special day in Malaysia based on road traffic?",
        answers: [
            { text: "Car Free Day", correct: true }, 
            { text: "Fun Friday", correct: false }, 
            { text: "Birthday Party", correct: false }, 
            { text: "Hari Kemerdekaan", correct: false }
        ]  
    },
    {
        question: "When is Road Safety Week?",
        answers: [
            { text: "19th of October", correct: false }, 
            { text: "23rd of Sepetember", correct: false }, 
            { text: "1st of January", correct: false }, 
            { text: "19th Of November", correct: true }
        ]
    },
    {
        question: "What special day is on the 3rd of June?",
        answers: [
            { text: "Road Safety Week", correct: false }, 
            { text: "World Bicycle Day", correct: true }, 
            { text: "Car Free Day", correct: false }, 
            { text: "World Day of Remembrence for Road Traffic Victims", correct: false }
        ]
    },
    {
        question: "Which is a type of road sign in Malaysia?",
        answers: [
            { text: "Hand Signs", correct: false }, 
            { text: "Signature", correct: false }, 
            { text: "Speed limit signs", correct: true }, 
            { text: "Signalman", correct: false }
        ]
    },
    {
        question: "When the traffic light turns orange in color what should you do?",
        answers: [
            { text: "Slow down", correct: true }, 
            { text: "Speed up", correct: false }, 
            { text: "Stop instatly", correct: false }, 
            { text: "Ignore it", correct: false }
        ]
    },
    {
        question: "When you are crossing the street you should...",
        answers: [
            { text: "Just run across the street", correct: false }, 
            { text: "Stick your hand out and walk across", correct: false }, 
            { text: "Look left and right first", correct: true }, 
            { text: "Play your phone", correct: false }
        ]
    },
    
];

const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-buttons");
const nextButton = document.getElementById("next-btn");

let currentQuestionIndex = 0;
let score = 0;

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    nextButton.innerHTML = "Next"
    showQuestion();
}

function showQuestion() {
    resetState();
    let currentQuestion = questions[currentQuestionIndex];
    let questionNo = currentQuestionIndex + 1;
    questionElement.innerHTML = questionNo + ". " + currentQuestion.question;

    currentQuestion.answers.forEach(answer => {
        const button = document.createElement("button");
        button.innerHTML = answer.text;
        button.classList.add("btn");
        answerButtons.appendChild(button);
        if(answer.correct){
            button.dataset.correct = answer.correct;
        }
        button.addEventListener("click", selectAnswer);
    });
}

function resetState() {
    nextButton.style.display = "none";
    while(answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

function selectAnswer(e) {
    const selectedBtn = e.target;
    const isCorrect = selectedBtn.dataset.correct === "true";
    if(isCorrect) {
        selectedBtn.classList.add("correct");
        score++;
    } else {
        selectedBtn.classList.add('incorrect');
    }
    Array.from(answerButtons.children).forEach(button => {
        if(button.dataset.correct === "true") {
            button.classList.add("correct");
        }
        button.disabled = true;
    });
    nextButton.style.display = "block";
}

function showScore() {
    resetState();
    questionElement.innerHTML = `You scored ${score} out of ${questions.length}!`;
    nextButton.innerHTML = "Play Again";
    nextButton.style.display = "block";
}

function handleNextButton() {
    currentQuestionIndex++
    if(currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showScore();
    }
}

nextButton.addEventListener("click", () => {
    if(currentQuestionIndex < questions.length) {
        handleNextButton();
    } else {
        startQuiz();
    }
});

startQuiz();