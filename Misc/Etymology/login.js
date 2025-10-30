// Import the new configuration
import config from './config.js';

// ============================================
// Authentication Module
// ============================================
const Auth = (() => {
    let loginForm, registerForm, 
        showRegisterLink, showLoginLink, loginError, registerError,
        registerSuccess;

    const cacheDOMElements = () => {
        loginForm = document.getElementById('login-form');
        registerForm = document.getElementById('register-form');
        showRegisterLink = document.getElementById('show-register-link');
        showLoginLink = document.getElementById('show-login-link');
        loginError = document.getElementById('login-error');
        registerError = document.getElementById('register-error');
        registerSuccess = document.getElementById('register-success');
    };
    
    const showLoginForm = (e) => {
        if (e) e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        registerError.classList.add('hidden');
        registerSuccess.classList.add('hidden');
    };
    
    const showRegisterForm = (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        loginError.classList.add('hidden');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            // Use the config variable for the API URL
            const response = await fetch(`${config.API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // --- UPDATED LOGIC ---
            // Your backend returns a user object, not a token.
            // We will store the user's ID and username.
            if (data.user && data.user.id && data.user.username) {
                sessionStorage.setItem('userId', data.user.id);
                sessionStorage.setItem('username', data.user.username);
                console.log('Login successful for:', data.user.username);
                
                // Redirect to the main app
                window.location.href = 'index.html';
            } else {
                throw new Error('Invalid user data received from server.');
            }
            
        } catch (err) {
            loginError.textContent = err.message;
            loginError.classList.remove('hidden');
        }
    };
    
    const handleRegister = async (e) => {
        e.preventDefault();
        registerError.classList.add('hidden');
        registerSuccess.classList.add('hidden');
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const securityQuestion = document.getElementById('register-question').value;
        const securityAnswer = document.getElementById('register-answer').value;
        
        if (password !== confirmPassword) {
            registerError.textContent = 'Passwords do not match.';
            registerError.classList.remove('hidden');
            return;
        }
        
        try {
            // Use the config variable for the API URL
            const response = await fetch(`${config.API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    securityQuestion,
                    securityAnswer
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            
            registerSuccess.textContent = 'Registration successful! Please log in.';
            registerSuccess.classList.remove('hidden');
            registerForm.reset();
            showLoginForm();
            
        } catch (err) {
            registerError.textContent = err.message;
            registerError.classList.remove('hidden');
        }
    };
    
    const init = () => {
        cacheDOMElements();
        // Check if elements exist before adding listeners (good practice)
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', showRegisterForm);
        }
        if (showLoginLink) {
            showLoginLink.addEventListener('click', showLoginForm);
        }
    };
    
    return { init };
})();

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});

