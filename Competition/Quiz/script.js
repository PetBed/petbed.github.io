const questions = [
	{
		question: "How to help when you witness a road accident?",
		answers: [
			{text: "Ignore and walk away", correct: false},
			{text: "Dial 999", correct: true},
			{text: "Take a picture", correct: false},
			{text: "Act like you didn't see it", correct: false},
		],
	},
	{
		question: "What are the effects of drunk driving?",
		answers: [
			{text: "Slows reaction time", correct: true},
			{text: "Helps with night vision", correct: false},
			{text: "Better steering", correct: false},
			{text: "Improved reaction time", correct: false},
		],
	},
	{
		question: "Which is a type of road accident?",
		answers: [
			{text: "Falling down the stair", correct: false},
			{text: "Meeting an old friend", correct: false},
			{text: "Greeting another driver", correct: false},
			{text: "Head-on collisions", correct: true},
		],
	},
	{
		question: "When does a road accident occur?",
		answers: [
			{text: "When you open a door", correct: false},
			{text: "When a vehicle hits an object, person or another vehicle", correct: true},
			{text: "When you fall off a chair", correct: false},
			{text: "When you drop your phone in the toilet", correct: false},
		],
	},
	{
		question: "What is an effect of road accidents?",
		answers: [
			{text: "Causes injury, fatality or damage", correct: true},
			{text: "Causes paper cuts", correct: false},
			{text: "Increased air-con maintenance fee", correct: false},
			{text: "Your cat will be starved", correct: false},
		],
	},
	{
		question: "Why should you have a dashcam in your vehicle?",
		answers: [
			{text: "Spy on other people", correct: false},
			{text: "Provide evidence in accident cases", correct: true},
			{text: "Post the footage on Youtube", correct: false},
			{text: "Make edits for TikTok", correct: false},
		],
	},
	{
		question: "When does a road accident occur?",
		answers: [
			{text: "When you open a door", correct: false},
			{text: "When a vehicle hits an object, person or another vehicle", correct: true},
			{text: "When you fall off a chair", correct: false},
			{text: "When you drop your phone in the toilet", correct: false},
		],
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
	nextButton.innerHTML = "Next";
	showQuestion();
}

function showQuestion() {
	resetState();
	let currentQuestion = questions[currentQuestionIndex];
	let questionNo = currentQuestionIndex + 1;
	questionElement.innerHTML = questionNo + ". " + currentQuestion.question;

	currentQuestion.answers.forEach((answer) => {
		const button = document.createElement("button");
		button.innerHTML = answer.text;
		button.classList.add("btn");
		answerButtons.appendChild(button);
		if (answer.correct) {
			button.dataset.correct = answer.correct;
		}
		button.addEventListener("click", selectAnswer);
	});
}

function resetState() {
	nextButton.style.opacity = "0";
	while (answerButtons.firstChild) {
		answerButtons.removeChild(answerButtons.firstChild);
	}
}

function selectAnswer(e) {
	const selectedBtn = e.target;
	const isCorrect = selectedBtn.dataset.correct === "true";
	if (isCorrect) {
		selectedBtn.classList.add("correct");
		score++;
	} else {
		selectedBtn.classList.add("incorrect");
	}
	Array.from(answerButtons.children).forEach((button) => {
		if (button.dataset.correct === "true") {
			button.classList.add("correct");
		}
		button.disabled = true;
	});
	nextButton.style.opacity = "1";
}

function showScore() {
	resetState();
	questionElement.innerHTML = `You scored ${score} out of ${questions.length}!`;
	nextButton.innerHTML = "Play Again";
	nextButton.style.opacity = "1";
}

function handleNextButton() {
	currentQuestionIndex++;
	if (currentQuestionIndex < questions.length) {
		showQuestion();
	} else {
		showScore();
	}
}

nextButton.addEventListener("click", () => {
	if (currentQuestionIndex < questions.length) {
		handleNextButton();
	} else {
		startQuiz();
	}
});

startQuiz();
