import TarotAPI from './api.js';
import SpreadBuilder from './spreadBuilder.js';
import JournalManager from './journal.js';
import DeckManager from './deck.js';

const api = new TarotAPI();
let builder = null;
let journal = null;
let deck = null;

// --- AUTH UI UPDATES ---
function updateAuthUI() {
    const authView = document.getElementById('view-auth');
    const appWrapper = document.getElementById('app-wrapper');

    if (api.isLoggedIn()) {
        if(authView) authView.classList.add('hidden');
        if(appWrapper) appWrapper.classList.remove('hidden');
        
        const userDisplay = document.getElementById('user-display');
        if(userDisplay) userDisplay.innerText = api.user.username;
        
        const welcomeMsg = document.getElementById('welcome-msg');
        if(welcomeMsg) welcomeMsg.innerText = `Welcome Back, ${api.user.username}`;
        
        if (!builder) {
            // Init Sub-modules
            if(document.getElementById('builder-canvas')) {
                builder = new SpreadBuilder('builder-canvas', api);
            }
            journal = new JournalManager(api);
            deck = new DeckManager(api);
            
            // Re-bind builder buttons safely
            const btnAdd = document.getElementById('btn-add-slot');
            if(btnAdd) btnAdd.onclick = () => builder.addSlot();
            
            const btnSaveSpread = document.getElementById('btn-save-spread');
            if(btnSaveSpread) btnSaveSpread.onclick = async () => {
                await builder.save();
                populateBuilderSpreads();
            };
            
            const backBtn = document.getElementById('btn-builder-back');
            if(backBtn) backBtn.onclick = () => showBuilderGrid();

            // Deck Bindings safely
            const btnSaveNote = document.getElementById('btn-save-card-note');
            if(btnSaveNote) btnSaveNote.onclick = () => deck.saveCurrentCard();
            
            const btnCloseNote = document.getElementById('btn-close-card-editor');
            if(btnCloseNote) btnCloseNote.onclick = () => deck.closeEditor();
        }
        
        api.bootstrap().then(() => showView('dashboard'));
    } else {
        if(authView) authView.classList.remove('hidden');
        if(appWrapper) appWrapper.classList.add('hidden');
    }
}

// --- VIEW ROUTER ---
function showView(viewName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if(btn.dataset.view === viewName) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        if(v.id === 'view-reading-editor') v.classList.add('hidden');
        if(v.id === 'view-card-editor') v.classList.add('hidden');
    });
    
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.add('active');
        if(viewName === 'readings' && journal) journal.loadReadingsList();
        if(viewName === 'stats') loadStats();
        if(viewName === 'builder') showBuilderGrid();
        if(viewName === 'deck' && deck) deck.renderLibrary();
    }
}

// --- BUILDER LOGIC ---
function showBuilderGrid() {
    const sel = document.getElementById('builder-mode-select');
    const edit = document.getElementById('builder-mode-edit');
    if(sel) sel.classList.remove('hidden');
    if(edit) edit.classList.add('hidden');
    renderSpreadGrid();
}

function showBuilderEditor(spread) {
    const sel = document.getElementById('builder-mode-select');
    const edit = document.getElementById('builder-mode-edit');
    if(sel) sel.classList.add('hidden');
    if(edit) edit.classList.remove('hidden');
    
    if (builder) {
        if (spread) builder.loadSpread(spread);
        else builder.reset();
    }
}

function renderSpreadGrid() {
    const grid = document.getElementById('spread-selection-grid');
    if(!grid) return;

    grid.innerHTML = '';
    
    const createCard = document.createElement('div');
    createCard.className = 'reading-item create-new-card'; 
    createCard.innerHTML = `
        <i class="ph ph-plus" style="font-size: 2rem; color: var(--primary); margin-bottom: 10px;"></i>
        <h3 style="margin:0">Create New</h3>
    `;
    createCard.onclick = () => showBuilderEditor(null);
    grid.appendChild(createCard);

    api.spreads.forEach(s => {
         const card = document.createElement('div');
         card.className = 'reading-item'; 
         card.innerHTML = `
             <h3>${s.name}</h3>
             <p style="color: var(--text-muted);">${s.positions.length} Cards</p>
             <div style="margin-top: 10px; font-size: 0.8rem; color: var(--primary);">
                <i class="ph ph-pencil-simple"></i> Edit Layout
             </div>
         `;
         card.onclick = () => showBuilderEditor(s);
         grid.appendChild(card);
    });
}

// --- STATS ---
async function loadStats() {
    const data = await api.getStats();
    if (!data) return;

    const chartStatus1 = Chart.getChart("chart-suits"); 
    if (chartStatus1) chartStatus1.destroy();
    
    const chartStatus2 = Chart.getChart("chart-orientation"); 
    if (chartStatus2) chartStatus2.destroy();

    Chart.defaults.color = '#8b92a5';
    Chart.defaults.borderColor = '#2d313a';

    const canvasS = document.getElementById('chart-suits');
    if(canvasS) {
        new Chart(canvasS.getContext('2d'), {
            type: 'bar', 
            data: {
                labels: data.suits.map(s => s._id),
                datasets: [{
                    label: 'Cards Drawn',
                    data: data.suits.map(s => s.count),
                    backgroundColor: '#d4b483',
                    borderRadius: 4
                }]
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }
    
    const canvasO = document.getElementById('chart-orientation');
    if(canvasO) {
        new Chart(canvasO.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: data.orientations.map(s => s._id),
                datasets: [{
                    data: data.orientations.map(s => s.count),
                    backgroundColor: ['#d4b483', '#2d313a'],
                    borderWidth: 0
                }]
            }
        });
    }
}

// --- MOBILE SIDEBAR ---
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if(sidebar) sidebar.classList.toggle('open');
    if(overlay) overlay.classList.toggle('active');
}

// --- SETUP LISTENERS ---
function setupAuthListeners() {
    // Helper to safely bind
    const bind = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) el[event] = fn;
    };

    bind('link-to-register', 'onclick', (e) => {
        e.preventDefault();
        document.getElementById('form-login').classList.add('hidden');
        document.getElementById('form-register').classList.remove('hidden');
    });

    bind('link-to-login', 'onclick', (e) => {
        e.preventDefault();
        document.getElementById('form-register').classList.add('hidden');
        document.getElementById('form-login').classList.remove('hidden');
    });

    bind('form-login', 'onsubmit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const res = await api.login(fd.get('email'), fd.get('password'));
        if (res.success) updateAuthUI();
        else {
            const errEl = document.getElementById('login-error');
            if(errEl) errEl.innerText = res.error;
        }
    });

    bind('form-register', 'onsubmit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        const res = await api.register(data);
        if (res.success) updateAuthUI();
        else {
            const errEl = document.getElementById('register-error');
            if(errEl) errEl.innerText = res.error;
        }
    });

    bind('btn-logout', 'onclick', () => {
        api.logout();
        updateAuthUI();
    });
}

function setupAppListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            showView(view);
            if(window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                if(sidebar && sidebar.classList.contains('open')) toggleSidebar();
            }
        });
    });

    // Mobile Toggle
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    if(toggleBtn) toggleBtn.onclick = toggleSidebar;
    
    const overlay = document.getElementById('sidebar-overlay');
    if(overlay) overlay.onclick = toggleSidebar;

    // View Actions (Safe Binds)
    const bindClick = (id, fn) => {
        const el = document.getElementById(id);
        if(el) el.onclick = fn;
    };

    bindClick('btn-quick-reading', () => {
        const editor = document.getElementById('view-reading-editor');
        if(editor) editor.classList.remove('hidden');
        if(journal) journal.startNewReading();
    });

    bindClick('btn-quick-builder', () => showView('builder'));

    bindClick('btn-new-reading', () => {
        const editor = document.getElementById('view-reading-editor');
        if(editor) editor.classList.remove('hidden');
        if(journal) journal.startNewReading();
    });

    bindClick('btn-back-journal', () => {
        const editor = document.getElementById('view-reading-editor');
        if(editor) editor.classList.add('hidden');
        showView('readings'); 
    });

    bindClick('btn-save-reading', async () => {
        if(journal) {
            await journal.saveEntry();
            const editor = document.getElementById('view-reading-editor');
            if(editor) editor.classList.add('hidden');
            showView('readings');
        }
    });
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    await api.init();
    setupAuthListeners();
    setupAppListeners();
    updateAuthUI();
});