import { API } from './api.js';
import { State } from './state.js';
import { renderHome } from './views/home.js';
import { renderEntityPage } from './views/entity.js';
import { renderEditor, renderNewEntrySelector } from './views/editor.js';
import { renderLogin } from './views/login.js';
import { renderMap } from './views/map.js'; // NEW

// Init
async function init() {
    const app = document.getElementById('app');
    
    // Apply Theme
    if (State.theme) document.body.setAttribute('data-theme', State.theme);

    // Check Auth
    const storedUser = localStorage.getItem('archive_user_id');
    State.setCurrentUser(storedUser);
    updateAuthUI();

    // Load Data
    const atlasData = await API.getAtlas();
    State.setAtlas(atlasData);
    console.log(`Loaded ${atlasData.length} entities from Atlas`);

    // Setup Global Listeners
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); logout(); });

    // Setup Nav Buttons
    setupSyncButton();
    setupThemeToggle();
    setupMobileMenu(); 

    // Routing
    window.addEventListener('hashchange', router);
    router();
}

function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const content = document.getElementById('navContent');
    const overlay = document.getElementById('mobileOverlay');
    
    if (!btn || !content || !overlay) return;

    const toggleMenu = () => {
        const isOpen = content.classList.contains('open');
        content.classList.toggle('open');
        overlay.classList.toggle('open');
        btn.setAttribute('aria-expanded', !isOpen);
        document.body.style.overflow = isOpen ? '' : 'hidden';
    };

    btn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    content.addEventListener('click', (e) => {
        // Close menu when a link is clicked, but NOT when interacting with utility toggles
        if (e.target.tagName === 'A' || e.target.closest('.nav-item')) {
            if (content.classList.contains('open')) toggleMenu();
        }
    });
}

function setupThemeToggle() {
    const container = document.getElementById('navUtilities');
    if (!container || document.getElementById('theme-toggle-input')) return;

    // Create Toggle Switch Structure
    const label = document.createElement('label');
    label.className = 'theme-switch';
    label.innerHTML = `
        <input type="checkbox" id="theme-toggle-input">
        <span class="slider round">
            <i class="toggle-icon icon-light" style="position: absolute; left: 6px; color: #f39c12;">☀</i>
            <i class="toggle-icon icon-dark" style="position: absolute; right: 6px; color: #f1c40f;">☾</i>
        </span>
    `;

    const input = label.querySelector('input');
    // Set initial state
    input.checked = State.theme === 'dark';

    input.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        State.setTheme(newTheme);
        // Reload map if on map page to update colors
        if (window.location.hash === '#/map') {
            renderMap(document.getElementById('app'));
        }
    });

    container.appendChild(label);
}

function setupSyncButton() {
    const container = document.getElementById('navUtilities');
    if (!container || document.getElementById('syncBtn')) return;

    const syncBtn = document.createElement('button');
    syncBtn.id = 'syncBtn';
    syncBtn.className = 'icon-btn';
    syncBtn.title = 'Force sync with server';
    syncBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
    `;
    
    syncBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const icon = syncBtn.querySelector('svg');
        // Simple rotation animation
        icon.style.transition = 'transform 1s ease';
        icon.style.transform = 'rotate(360deg)';
        syncBtn.style.pointerEvents = 'none';
        
        try {
            const newAtlas = await API.sync();
            State.setAtlas(newAtlas);
            await router();
            
            // Reset animation
            setTimeout(() => {
                icon.style.transition = 'none';
                icon.style.transform = 'none';
                syncBtn.style.pointerEvents = 'auto';
            }, 1000);
        } catch (err) {
            console.error(err);
            syncBtn.style.color = '#dc3545'; // Red error
            setTimeout(() => {
                syncBtn.style.color = '';
                syncBtn.style.pointerEvents = 'auto';
                icon.style.transition = 'none';
                icon.style.transform = 'none';
            }, 2000);
        }
    });

    container.appendChild(syncBtn);
}

function updateAuthUI() {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const userDisplay = document.getElementById('userDisplay');
    const userControls = document.getElementById('userControls');

    let createBtn = document.getElementById('createEntryBtn');
    if (!createBtn) {
        createBtn = document.createElement('a');
        createBtn.id = 'createEntryBtn';
        createBtn.href = '#/new';
        createBtn.textContent = '+ New Entry';
        createBtn.style.marginRight = '1rem';
        createBtn.style.color = 'var(--era-ww1)';
        createBtn.style.fontWeight = 'bold';
        createBtn.style.textDecoration = 'none';
        userControls.insertBefore(createBtn, userDisplay);
    }

    if (State.currentUser) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'inline-block';
        userDisplay.style.display = 'inline-block';
        userDisplay.textContent = `User: ${State.currentUser.substring(0, 6)}...`; 
        createBtn.style.display = 'inline-block';
    } else {
        loginLink.style.display = 'inline-block';
        logoutLink.style.display = 'none';
        userDisplay.style.display = 'none';
        createBtn.style.display = 'none';
    }
}

function logout() {
    State.setCurrentUser(null);
    updateAuthUI();
    window.location.hash = '#/';
}

async function router() {
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');
    
    if (hash === '#/') {
        renderHome(app);
    } 
    else if (hash === '#/login') {
        renderLogin(app, () => { updateAuthUI(); window.location.hash = '#/'; });
    }
    else if (hash === '#/map') { // NEW
        renderMap(app);
    }
    else if (hash === '#/new') {
        if (!State.currentUser) { window.location.hash = '#/login'; return; }
        renderNewEntrySelector(app, (type) => renderEditor(app, type)); 
    }
    else if (hash.startsWith('#/edit/')) {
        if (!State.currentUser) { window.location.hash = '#/login'; return; }
        const slug = hash.replace('#/edit/', '');
        const data = await API.getEntity(slug);
        if (data) renderEditor(app, data.type, data);
        else app.innerHTML = '<h1>Error: Entry not found</h1>';
    }
    else if (hash.startsWith('#/entity/')) {
        const slug = hash.replace('#/entity/', '');
        renderEntityPage(app, slug);
    }
}

// Start
init();