document.addEventListener("DOMContentLoaded", function () {
	// --- DOM Elements ---
	const loginForm = document.getElementById("login-form");
	const registerForm = document.getElementById("register-form");
	const forgotPasswordForm = document.getElementById("forgot-password-form");

	const showRegisterBtn = document.getElementById("show-register");
	const showLoginRegisterBtn = document.getElementById("show-login-register");
	const showLoginForgotBtn = document.getElementById("show-login-forgot");
	const showForgotPasswordBtn = document.getElementById("show-forgot-password");

	const loginErrorEl = document.getElementById("login-error");
	const registerErrorEl = document.getElementById("register-error");
	const forgotErrorEl = document.getElementById("forgot-error");
	const forgotSuccessEl = document.getElementById("forgot-success");

	const step1Email = document.getElementById("step1-email");
	const step2Question = document.getElementById("step2-question");
	const securityQuestionText = document.getElementById("security-question-text");
	const forgotContinueBtn = document.getElementById("forgot-continue-btn");

	// --- State ---
	const API_URL = "https://wot-tau.vercel.app"; // local: http://localhost:3005
	let resetUserId = null;

	// --- Initial Check ---
	if (localStorage.getItem("studyUser")) {
		window.location.href = "index.html";
	}

	// --- Form Switching ---
	showRegisterBtn.addEventListener("click", (e) => {
		e.preventDefault();
		loginForm.classList.add("hidden");
		forgotPasswordForm.classList.add("hidden");
		registerForm.classList.remove("hidden");
	});

	[showLoginRegisterBtn, showLoginForgotBtn].forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.preventDefault();
			registerForm.classList.add("hidden");
			forgotPasswordForm.classList.add("hidden");
			loginForm.classList.remove("hidden");
			resetForgotPasswordForm();
		});
	});

	showForgotPasswordBtn.addEventListener("click", (e) => {
		e.preventDefault();
		loginForm.classList.add("hidden");
		registerForm.classList.add("hidden");
		forgotPasswordForm.classList.remove("hidden");
		resetForgotPasswordForm();
	});

	// --- Event Listeners ---
	loginForm.addEventListener("submit", handleLogin);
	registerForm.addEventListener("submit", handleRegister);
	forgotContinueBtn.addEventListener("click", handleForgotPasswordStep1);
	forgotPasswordForm.addEventListener("submit", handleForgotPasswordStep2);

	// --- Handlers ---
	async function handleLogin(e) {
		e.preventDefault();
		const email = document.getElementById("login-email").value;
		const password = document.getElementById("login-password").value;
		loginErrorEl.textContent = "";

		try {
			const response = await fetch(`${API_URL}/api/study/login`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({email, password}),
			});
			const data = await response.json();
			if (data.error) {
				loginErrorEl.textContent = data.error;
			} else {
				localStorage.setItem("studyUser", JSON.stringify(data.user));
				window.location.href = "index.html";
			}
		} catch (err) {
			loginErrorEl.textContent = "An error occurred. Please try again.";
		}
	}

	async function handleRegister(e) {
		e.preventDefault();
		const username = document.getElementById("register-username").value;
		const email = document.getElementById("register-email").value;
		const password = document.getElementById("register-password").value;
		const securityQuestion = document.getElementById("register-security-question").value;
		const securityAnswer = document.getElementById("register-security-answer").value;
		registerErrorEl.textContent = "";

		if (!securityQuestion) {
			registerErrorEl.textContent = "Please select a security question.";
			return;
		}

		try {
			const response = await fetch(`${API_URL}/api/study/register`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({username, email, password, securityQuestion, securityAnswer}),
			});
			const data = await response.json();
			if (data.error) {
				registerErrorEl.textContent = data.error;
			} else {
				localStorage.setItem("studyUser", JSON.stringify(data.user));
				window.location.href = "index.html";
			}
		} catch (err) {
			registerErrorEl.textContent = "An error occurred. Please try again.";
		}
	}

	async function handleForgotPasswordStep1() {
		forgotErrorEl.textContent = "";
		const email = document.getElementById("forgot-email").value;
		if (!email) {
			forgotErrorEl.textContent = "Please enter your email.";
			return;
		}

		try {
			const response = await fetch(`${API_URL}/api/study/forgot-password/step1`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({email}),
			});
			const data = await response.json();
			if (data.error) {
				forgotErrorEl.textContent = data.error;
			} else {
				resetUserId = data.userId;
				const questionMap = {
					first_pet: "What was your first pet's name?",
					mother_maiden: "What is your mother's maiden name?",
					birth_city: "In what city were you born?",
				};
				securityQuestionText.textContent = questionMap[data.securityQuestion];
				step1Email.classList.add("hidden");
				step2Question.classList.remove("hidden");
			}
		} catch (err) {
			forgotErrorEl.textContent = "An error occurred. Please try again.";
		}
	}

	async function handleForgotPasswordStep2(e) {
		e.preventDefault();
		if (!resetUserId) return;

		forgotErrorEl.textContent = "";
		forgotSuccessEl.classList.add("hidden");

		const securityAnswer = document.getElementById("forgot-security-answer").value;
		const newPassword = document.getElementById("forgot-new-password").value;
		try {
			const response = await fetch(`${API_URL}/api/study/forgot-password/step2`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({userId: resetUserId, securityAnswer, newPassword}),
			});
			const data = await response.json();
			if (data.error) {
				forgotErrorEl.textContent = data.error;
			} else {
				forgotSuccessEl.textContent = data.message;
				forgotSuccessEl.classList.remove("hidden");
				step2Question.classList.add("hidden");
				setTimeout(() => {
					registerForm.classList.add("hidden");
					forgotPasswordForm.classList.add("hidden");
					loginForm.classList.remove("hidden");
					resetForgotPasswordForm();
				}, 3000);
			}
		} catch (err) {
			forgotErrorEl.textContent = "An error occurred. Please try again.";
		}
	}

	function resetForgotPasswordForm() {
		resetUserId = null;
		forgotPasswordForm.reset();
		forgotErrorEl.textContent = "";
		forgotSuccessEl.classList.add("hidden");
		step1Email.classList.remove("hidden");
		step2Question.classList.add("hidden");
	}
});
