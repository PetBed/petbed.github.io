import { API } from '../api.js';
import { State } from '../state.js';

export function renderLogin(container, onLoginSuccess) {
    const template = document.getElementById('login-page-template');
    const page = template.content.cloneNode(true);
    const form = page.querySelector('#login-form');
    const errorMsg = page.querySelector('#login-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.email.value; 
        const password = form.password.value;
        
        errorMsg.textContent = "Authenticating...";
        
        try {
            const data = await API.login(email, password);
            State.setCurrentUser(data.userId);
            if (onLoginSuccess) onLoginSuccess();
        } catch (err) {
            errorMsg.textContent = err.message;
        }
    });

    container.innerHTML = '';
    container.appendChild(page);
}