import { API } from './api.js';

// State
let atlas = [];
let currentUser = null;

// Init
async function init() {
    const app = document.getElementById('app');
    
    // 1. Check Auth (Persist session)
    const storedUser = localStorage.getItem('archive_user_id');
    if (storedUser) {
        currentUser = storedUser;
    }
    updateAuthUI();

    // 2. Load the Atlas (Skeleton)
    atlas = await API.getAtlas();
    console.log(`Loaded ${atlas.length} entities from Atlas`);

    // 3. Setup Global Event Listeners
    setupGlobalEvents();

    // 4. Handle Routing
    window.addEventListener('hashchange', router);
    
    // 5. Initial Route
    router();
}

function setupGlobalEvents() {
    // Logout Handler
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

function updateAuthUI() {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const userDisplay = document.getElementById('userDisplay');
    const userControls = document.getElementById('userControls');

    // Create or find the "New Entry" button
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

    if (currentUser) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'inline-block';
        userDisplay.style.display = 'inline-block';
        userDisplay.textContent = `User: ${currentUser.substring(0, 6)}...`; 
        createBtn.style.display = 'inline-block';
    } else {
        loginLink.style.display = 'inline-block';
        logoutLink.style.display = 'none';
        userDisplay.style.display = 'none';
        createBtn.style.display = 'none';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('archive_user_id');
    updateAuthUI();
    window.location.hash = '#/'; // Redirect home
}

// Router
async function router() {
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');
    
    // Route Matching
    if (hash === '#/') {
        renderHome(app);
    } 
    else if (hash === '#/login') {
        renderLogin(app);
    }
    else if (hash === '#/new') {
        if (!currentUser) { window.location.hash = '#/login'; return; }
        renderNewEntrySelector(app); 
    }
    // NEW: Edit Route
    else if (hash.startsWith('#/edit/')) {
        if (!currentUser) { window.location.hash = '#/login'; return; }
        const slug = hash.replace('#/edit/', '');
        const data = await API.getEntity(slug);
        if (data) {
            // Pass existing data to the editor
            renderEditor(app, data.type, data);
        } else {
            app.innerHTML = '<h1>Error: Entry not found</h1>';
        }
    }
    else if (hash.startsWith('#/entity/')) {
        const slug = hash.replace('#/entity/', '');
        renderEntityPage(app, slug);
    }
}

// Renderers
function renderHome(container) {
    // 1. Setup UI Structure with Controls
    container.innerHTML = `
        <div class="home-header">
            <h1>History Timeline</h1>
            <p>Explore the connected events of history.</p>
            
            <div class="controls-bar" style="background: white; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                <!-- Search -->
                <div>
                    <label style="display:block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">Search</label>
                    <input type="text" id="filter-search" placeholder="Filter by title..." style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                </div>

                <!-- Sort -->
                <div>
                    <label style="display:block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">Sort By</label>
                    <select id="sort-by" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="year-asc">Year (Oldest First)</option>
                        <option value="year-desc">Year (Newest First)</option>
                        <option value="title-asc">Title (A-Z)</option>
                    </select>
                </div>

                <!-- Type Filter -->
                <div>
                    <label style="display:block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">Type</label>
                    <select id="filter-type" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="all">All Types</option>
                        <option value="event">Events</option>
                        <option value="actor">Actors</option>
                        <option value="context">Contexts</option>
                        <option value="theme">Themes</option>
                    </select>
                </div>

                <!-- Era Filter -->
                <div>
                    <label style="display:block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">Era</label>
                    <select id="filter-era" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="all">All Eras</option>
                        <option value="pre-ww1">Pre-WWI</option>
                        <option value="ww1">WWI</option>
                        <option value="interwar">Interwar</option>
                        <option value="ww2">WWII</option>
                        <option value="post-ww2">Post-WWII</option>
                    </select>
                </div>
            </div>
        </div>

        <div id="timeline-results" class="timeline-list">
            <!-- Results injected here -->
        </div>
    `;

    // 2. Logic to update list
    const updateList = () => {
        const searchVal = document.getElementById('filter-search').value.toLowerCase();
        const sortVal = document.getElementById('sort-by').value;
        const typeVal = document.getElementById('filter-type').value;
        const eraVal = document.getElementById('filter-era').value;

        // Filter
        let filtered = atlas.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchVal);
            const matchesType = typeVal === 'all' || item.type === typeVal;
            const matchesEra = eraVal === 'all' || item.era === eraVal;
            return matchesSearch && matchesType && matchesEra;
        });

        // Sort
        filtered.sort((a, b) => {
            if (sortVal === 'year-asc') return (a.year || 9999) - (b.year || 9999);
            if (sortVal === 'year-desc') return (b.year || 9999) - (a.year || 9999);
            if (sortVal === 'title-asc') return a.title.localeCompare(b.title);
            return 0;
        });

        // Render
        const resultsContainer = document.getElementById('timeline-results');
        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align:center; color:#666;">No entries found matching filters.</p>';
            return;
        }

        resultsContainer.innerHTML = filtered.map(item => `
            <a href="#/entity/${item.slug}" class="timeline-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid #eee; text-decoration: none; color: inherit; transition: background 0.2s;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="year" style="font-weight: bold; color: var(--era-ww1); min-width: 50px;">${item.year || '—'}</span>
                    <div>
                        <div class="title" style="font-weight: 600; font-size: 1.1rem;">${item.title}</div>
                        <div class="era-small" style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-top:2px;">${item.era}</div>
                    </div>
                </div>
                <span class="type badge" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #f1f3f5; border-radius: 4px; color: #495057; text-transform: uppercase; font-weight:600;">${item.type}</span>
            </a>
        `).join('');
    };

    // 3. Attach Listeners
    const inputs = container.querySelectorAll('input, select');
    inputs.forEach(input => input.addEventListener('input', updateList));

    // 4. Initial Render
    updateList();
}

function renderLogin(container) {
    // Clone Template
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
            
            // Login Success
            currentUser = data.userId;
            localStorage.setItem('archive_user_id', currentUser);
            
            updateAuthUI();
            window.location.hash = '#/'; // Go to home after login
        } catch (err) {
            errorMsg.textContent = err.message;
        }
    });

    container.innerHTML = '';
    container.appendChild(page);
}

// NEW: Selection Modal
function renderNewEntrySelector(container) {
    container.innerHTML = `
        <div class="selection-container" style="max-width: 800px; margin: 4rem auto; text-align: center;">
            <h1 style="font-family: var(--font-reading);">Create New Entry</h1>
            <p style="color: #666; margin-bottom: 3rem;">Select the type of history entry you want to create.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem;">
                <div class="type-card" data-type="event" style="padding: 2rem; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; background: white; transition: all 0.2s;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">📅</div>
                    <h3 style="margin: 0; color: var(--text-main);">Event</h3>
                    <p style="font-size: 0.85rem; color: #888;">A specific occurrence in time.</p>
                </div>

                <div class="type-card" data-type="actor" style="padding: 2rem; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; background: white; transition: all 0.2s;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">👤</div>
                    <h3 style="margin: 0; color: var(--text-main);">Actor</h3>
                    <p style="font-size: 0.85rem; color: #888;">Person, Country, or Group.</p>
                </div>

                <div class="type-card" data-type="context" style="padding: 2rem; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; background: white; transition: all 0.2s;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">🌍</div>
                    <h3 style="margin: 0; color: var(--text-main);">Context</h3>
                    <p style="font-size: 0.85rem; color: #888;">Societal forces or conditions.</p>
                </div>

                <div class="type-card" data-type="theme" style="padding: 2rem; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; background: white; transition: all 0.2s;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">📖</div>
                    <h3 style="margin: 0; color: var(--text-main);">Theme</h3>
                    <p style="font-size: 0.85rem; color: #888;">Recurring patterns across history.</p>
                </div>
            </div>
        </div>
    `;

    // Add Hover Effects & Click Listeners
    container.querySelectorAll('.type-card').forEach(card => {
        card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-5px)'; card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; card.style.borderColor = 'var(--era-ww1)'; });
        card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; card.style.borderColor = '#ddd'; });
        card.addEventListener('click', () => {
            renderEditor(container, card.dataset.type);
        });
    });
}

// UPDATED: Editor Function (Accepts existingData for Edit Mode)
function renderEditor(container, type = 'event', existingData = null) {
    
    // Helpers for pre-filling values
    const v = (key) => existingData ? (existingData[key] || '') : '';
    
    // Helper for finding connection string: "Title 1, Title 2"
    const cVal = (connType) => {
        if (!existingData || !existingData.connections) return '';
        return existingData.connections
            .filter(c => c.type === connType)
            .map(c => c.targetTitle)
            .join(', ');
    };

    // Helper to set selected era
    const isSel = (val) => (existingData && existingData.era === val) ? 'selected' : '';

    // Dynamic Layout Logic for Header and Sidebar
    let headerExtraInputs = '';
    let sidebarInputs = '';
    
    // Default Placeholders
    let contentPlaceholder = "";
    let takeawayLabel = "The Takeaway";
    let takeawayPlaceholder = "One sentence: Why does this matter?";

    // 1. Configure Type-Specific Metadata & Sidebar
    if (type === 'event') {
        contentPlaceholder = `::: summary\nWrite a brief 1-2 paragraph summary here...\n:::\n\nDescribe the sequence of events...`;
        
        headerExtraInputs = `
            <input type="text" name="dateDisplay" value="${v('dateDisplay')}" placeholder="Display Date (e.g. June 28)" style="flex-grow: 1; padding: 0.25rem; border: 1px solid #eee; border-radius: 4px;">
            <span>·</span>
            <input type="text" name="location" value="${v('location')}" placeholder="Location" style="flex-grow: 1; padding: 0.25rem; border: 1px solid #eee; border-radius: 4px;">
        `;
        sidebarInputs = `
            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Caused By</label>
                <input type="text" name="conn_caused_by" value="${cVal('caused_by')}" list="atlas-list" placeholder="Titles..." style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Leads To</label>
                <input type="text" name="conn_leads_to" value="${cVal('leads_to')}" list="atlas-list" placeholder="Titles..." style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Related Events</label>
                <input type="text" name="conn_related_to" value="${cVal('related_to')}" list="atlas-list" placeholder="Titles..." style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            </div>
        `;
    } 
    else if (type === 'actor') {
        contentPlaceholder = `::: summary\nMotivations & Fears (Not biography). What drives them?\n:::\n\n### Constraints\nWhat limits them?\n\n### Key Decisions\n- Decision 1\n- Decision 2\n\n### Biography\nBackground info...`;
        
        takeawayLabel = "Narrative Role";
        takeawayPlaceholder = "e.g. Antagonist, Declining Power";

        headerExtraInputs = `
             <input type="text" name="location" value="${v('location')}" placeholder="Origin / State" style="flex-grow: 1; padding: 0.25rem; border: 1px solid #eee; border-radius: 4px;">
        `;
        
        sidebarInputs = `
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Relationships (Allies/Rivals)</label>
                <input type="text" name="conn_related_to" value="${cVal('related_to')}" list="atlas-list" placeholder="Other Actors..." style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Participated In</label>
                <input type="text" name="conn_participated_in" value="${cVal('participated_in')}" list="atlas-list" placeholder="Event Titles..." style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            </div>
        `;
    } 
    else if (type === 'context') {
        contentPlaceholder = `::: summary\nDefinition: What is this force or system?\n:::\n\n### Origins\nWhy does it exist?\n\n### Mechanism\nHow does it shape events?\n\n### Evolution\nHow has it changed over time?`;
        
        takeawayLabel = null;

        headerExtraInputs = `
             <input type="text" name="location" value="${v('location')}" placeholder="Region / Scope" style="flex-grow: 1; padding: 0.25rem; border: 1px solid #eee; border-radius: 4px;">
        `;

        sidebarInputs = `
             <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Related Entries</label>
                <input type="text" name="conn_related_to" value="${cVal('related_to')}" list="atlas-list" placeholder="Titles..." style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            </div>
        `;
    }
    else {
        // Theme
        contentPlaceholder = `::: summary\nDefine the recurring theme...\n:::\n\nWhere does this appear in history?`;
        
        sidebarInputs = `
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display:block; font-size:0.8rem; font-weight:700; margin-bottom:0.25rem;">Related Entries</label>
                <input type="text" name="conn_related_to" value="${cVal('related_to')}" list="atlas-list" placeholder="Titles..." style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            </div>
        `;
    }

    // Determine content to show: Existing content OR placeholder
    const editorContent = existingData ? existingData.content : contentPlaceholder;

    container.innerHTML = `
        <article class="event-page">
            <form id="editor-form">
                <!-- HEADER SECTION -->
                <header class="event-header" style="border-bottom: 2px dashed #ddd; padding-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <!-- Type Visual -->
                        <div style="padding: 0.5rem; border-radius: 4px; background: #e9ecef; font-weight: 600; color: #495057; text-transform: uppercase;">
                            ${type}
                            <input type="hidden" name="type" value="${type}">
                        </div>
                        
                        <!-- Era Select -->
                        <select name="era" style="padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd; font-weight: bold; background: #f8f9fa;">
                            <option value="pre-ww1" ${isSel('pre-ww1')}>Pre-WWI</option>
                            <option value="ww1" ${isSel('ww1')}>WWI</option>
                            <option value="interwar" ${isSel('interwar')}>Interwar</option>
                            <option value="ww2" ${isSel('ww2')}>WWII</option>
                            <option value="post-ww2" ${isSel('post-ww2')}>Post-WWII</option>
                        </select>
                    </div>

                    <!-- Title Input -->
                    <input type="text" name="title" value="${v('title')}" required placeholder="Enter Title..." 
                        style="width: 100%; font-family: var(--font-reading); font-size: 2.5rem; border: none; border-bottom: 1px solid #eee; outline: none; margin-bottom: 0.5rem; background: transparent;">

                    <!-- Meta Bar Inputs (Dynamic) -->
                    <div class="meta-bar" style="display: flex; gap: 1rem; color: var(--text-muted); font-family: var(--font-ui); font-size: 0.9rem;">
                        <input type="number" name="year" value="${v('year')}" placeholder="Year (YYYY)" required style="width: 100px; padding: 0.25rem; border: 1px solid #eee; border-radius: 4px;">
                        <span>·</span>
                        ${headerExtraInputs}
                    </div>
                </header>

                <!-- SPLIT LAYOUT -->
                <div class="split-layout">
                    
                    <!-- LEFT COLUMN (Unified Editing) -->
                    <div class="narrative-column">
                        
                        <!-- Single Content Body -->
                        <div class="content-body" style="height: 100%;">
                            <label style="display:block; font-size: 0.8rem; font-weight: 700; color: #ccc; margin-bottom: 0.5rem; letter-spacing: 1px;">EDITOR (MARKDOWN + WIKI LINKS)</label>
                            
                            <!-- Help Tip -->
                            <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem; background: #f8f9fa; padding: 0.5rem; border-radius: 4px;">
                                <strong>Tip:</strong> Use <code>::: summary ... :::</code> to create the highlighted summary box. Use <code>[[Link]]</code> to connect pages.
                            </div>

                            <textarea name="content" required rows="25" placeholder="${contentPlaceholder}"
                                style="width: 100%; padding: 1rem; border: 1px solid #eee; border-radius: 4px; font-family: monospace; font-size: 1rem; line-height: 1.6; resize: vertical; min-height: 60vh;">${editorContent}</textarea>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN (Metadata & Connections) -->
                    <aside class="context-column">
                        
                        <!-- Takeaway / Narrative Role Card -->
                        ${takeawayLabel ? `
                        <div class="takeaway-card" style="margin-bottom: 2rem;">
                            <h4>${takeawayLabel}</h4>
                            <textarea name="takeaway" placeholder="${takeawayPlaceholder}" rows="3"
                                style="width: 100%; border: none; font-family: var(--font-reading); font-weight: 700; font-size: 1rem; outline: none; resize: vertical; background: transparent;">${v('takeaway')}</textarea>
                        </div>
                        ` : ''}

                        <!-- Connections Input Panel -->
                        <div class="connections-panel" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border: 1px solid #e9ecef;">
                            <h4 style="margin-top:0; color: var(--era-ww1);">Connections</h4>
                            
                            ${sidebarInputs}

                            <datalist id="atlas-list">
                                ${atlas.map(a => `<option value="${a.title}"></option>`).join('')}
                            </datalist>

                            <button type="submit" class="btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;">Save Entry</button>
                        </div>
                    </aside>
                </div>
            </form>
        </article>
    `;

    document.getElementById('editor-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        
        // 1. Get Unified Content
        const contentRaw = fd.get('content');

        // 2. Extract Summary for DB Metadata (Hidden logic)
        let summaryText = "";
        const summaryMatch = contentRaw.match(/:::\s*summary\s*([\s\S]*?)\s*:::/i);
        if (summaryMatch) {
            summaryText = summaryMatch[1].trim();
        } else {
            summaryText = contentRaw.substring(0, 200) + "...";
        }

        const data = {
            title: fd.get('title'),
            type: fd.get('type'),
            era: fd.get('era'),
            year: fd.get('year'),
            dateDisplay: fd.get('dateDisplay'),
            location: fd.get('location'),
            summary: summaryText, 
            content: contentRaw, 
            takeaway: fd.get('takeaway'),
            connections: []
        };

        // 3. Parse Connections
        const processConnections = (inputStr, type) => {
            if (!inputStr) return;
            const titles = inputStr.split(',').map(t => t.trim());
            titles.forEach(title => {
                const match = atlas.find(a => a.title.toLowerCase() === title.toLowerCase());
                if (match) {
                    data.connections.push({
                        target: match._id,
                        targetTitle: match.title,
                        type: type
                    });
                }
            });
        };

        processConnections(fd.get('conn_caused_by'), 'caused_by');
        processConnections(fd.get('conn_leads_to'), 'leads_to');
        processConnections(fd.get('conn_related_to'), 'related_to');
        processConnections(fd.get('conn_participated_in'), 'participated_in');
        
        try {
            const saved = await API.saveEntity(data);
            alert('Saved successfully!');
            await API.getAtlas(); 
            window.location.hash = `#/entity/${saved.slug}`;
        } catch (err) {
            alert('Error: ' + err.message);
        }
    });
}

// Helper: Delete Confirmation Modal
function showDeleteModal(title, onConfirm) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    
    modal.innerHTML = `
        <div style="background:white; padding:2rem; border-radius:8px; max-width:400px; text-align:center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <h3 style="margin-top:0;">Delete Entry?</h3>
            <p>Are you sure you want to delete <strong>${title}</strong>? This action cannot be undone.</p>
            <div style="margin-top:1.5rem; display:flex; gap:1rem; justify-content:center;">
                <button id="modal-cancel" style="padding:0.5rem 1rem; border:1px solid #ddd; background:white; border-radius:4px; cursor:pointer;">Cancel</button>
                <button id="modal-confirm" style="padding:0.5rem 1rem; border:none; background:#dc3545; color:white; border-radius:4px; cursor:pointer; font-weight:bold;">Delete Forever</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#modal-confirm').addEventListener('click', () => {
        onConfirm();
        modal.remove();
    });
}

async function renderEntityPage(container, slug) {
    container.innerHTML = '<div class="loading">Loading Scroll...</div>';
    
    const data = await API.getEntity(slug);
    
    if (!data) {
        container.innerHTML = '<h1>404 - Event Not Found</h1>';
        return;
    }

    // Clone Template
    const template = document.getElementById('event-page-template');
    const page = template.content.cloneNode(true);

    // Populate Metadata
    page.querySelector('#t-title').textContent = data.title;
    page.querySelector('#t-date').textContent = data.dateDisplay || data.year;
    page.querySelector('#t-location').textContent = data.location || 'Unknown Location';
    page.querySelector('#t-takeaway').textContent = data.takeaway || "No takeaway recorded.";
    
    // Era Styling
    page.querySelector('#t-era').textContent = data.era;
    page.querySelector('article').setAttribute('data-era', data.era);

    // Render Connections
    const causedBy = data.connections.filter(c => c.type === 'caused_by');
    const leadsTo = data.connections.filter(c => c.type === 'leads_to');
    const relatedTo = data.connections.filter(c => c.type === 'related_to');
    const participatedIn = data.connections.filter(c => c.type === 'participated_in'); 

    const renderLinks = (list, targetEl) => {
        if (list.length === 0) {
            targetEl.innerHTML = '<span style="color:#999; font-size:0.9rem;">None</span>';
            return;
        }
        targetEl.innerHTML = list.map(c => `
            <a href="#/entity/${c.target.slug}" class="link-card">
                → ${c.target.title}
            </a>
        `).join('');
    };

    renderLinks(causedBy, page.querySelector('#t-caused-by'));
    renderLinks(leadsTo, page.querySelector('#t-leads-to'));

    // Dynamic Connection Sections
    const connectionsPanel = page.querySelector('.connections-panel');
    
    if (participatedIn.length > 0) {
        const pHeader = document.createElement('h4');
        pHeader.textContent = "Participated In";
        const pContainer = document.createElement('div');
        pContainer.className = "link-list";
        renderLinks(participatedIn, pContainer);
        connectionsPanel.appendChild(pHeader);
        connectionsPanel.appendChild(pContainer);
    }

    if (relatedTo.length > 0) {
        const relatedHeader = document.createElement('h4');
        relatedHeader.textContent = data.type === 'actor' ? "Allies / Rivals" : "Related Events";
        const relatedContainer = document.createElement('div');
        relatedContainer.className = "link-list";
        renderLinks(relatedTo, relatedContainer);
        connectionsPanel.appendChild(relatedHeader);
        connectionsPanel.appendChild(relatedContainer);
    }

    // LEGACY SUMMARY HANDLING
    const hasCustomSummary = (data.content || '').includes('::: summary');
    const summarySection = page.querySelector('.summary-box');
    
    if (hasCustomSummary) {
        if (summarySection) summarySection.remove(); 
    } else {
        page.querySelector('#t-summary').textContent = data.summary;
    }

    // Inject Markdown Content
    page.querySelector('#t-content').innerHTML = parseContent(data.content || '');

    // NEW: Admin Controls (Icons)
    if (currentUser) {
        const header = page.querySelector('.event-header');
        header.style.position = 'relative'; // Ensure positioning context

        const controlsDiv = document.createElement('div');
        controlsDiv.style.position = 'absolute';
        controlsDiv.style.top = '0';
        controlsDiv.style.right = '0';
        controlsDiv.style.display = 'flex';
        controlsDiv.style.gap = '0.5rem';

        // 1. Edit Button
        const editBtn = document.createElement('button');
        editBtn.title = "Edit Entry";
        editBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--era-ww1);">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        `;
        // Common Styles
        const btnStyle = `background:none; border:none; cursor:pointer; padding:0.5rem; opacity:0.6; transition:opacity 0.2s;`;
        editBtn.style.cssText = btnStyle;
        editBtn.onmouseover = () => editBtn.style.opacity = '1';
        editBtn.onmouseout = () => editBtn.style.opacity = '0.6';
        
        editBtn.onclick = (e) => {
            e.stopPropagation();
            window.location.hash = `#/edit/${data.slug}`;
        };

        // 2. Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.title = "Delete Entry";
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #dc3545;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        `;
        deleteBtn.style.cssText = btnStyle;
        deleteBtn.onmouseover = () => deleteBtn.style.opacity = '1';
        deleteBtn.onmouseout = () => deleteBtn.style.opacity = '0.6';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteModal(data.title, async () => {
                try {
                    await API.deleteEntity(data.slug);
                    alert('Entry deleted successfully.');
                    await API.getAtlas();
                    window.location.hash = '#/';
                } catch (err) {
                    alert('Error deleting entry: ' + err.message);
                }
            });
        });

        controlsDiv.appendChild(editBtn);
        controlsDiv.appendChild(deleteBtn);
        header.appendChild(controlsDiv);
    }

    container.innerHTML = '';
    container.appendChild(page);
}

function parseContent(text) {
    if (!text) return '';

    // 1. Handle Custom Summary Block
    // Syntax: ::: summary \n Content \n :::
    let preProcessed = text.replace(/:::\s*summary\s*([\s\S]*?)\s*:::/gi, (match, content) => {
        return `<section class="summary-box"><h3>Summary</h3><p>${content.trim()}</p></section>`;
    });

    // 2. Handle Wiki Links: [[Title]] or [[Title|Display Text]]
    preProcessed = preProcessed.replace(/\[\[(.*?)\]\]/g, (match, content) => {
        let [targetTitle, displayText] = content.split('|');
        if (!displayText) displayText = targetTitle;
        
        targetTitle = targetTitle.trim();
        displayText = displayText.trim();

        const found = atlas.find(item => item.title.toLowerCase() === targetTitle.toLowerCase());
        
        if (found) {
            return `<a href="#/entity/${found.slug}" class="wiki-link valid" style="color: var(--era-ww1); font-weight: 600; text-decoration: none;">${displayText}</a>`;
        } else {
            return `<span class="wiki-link missing" title="Page not created yet" style="color: #adb5bd; cursor: help; border-bottom: 1px dashed #adb5bd;">${displayText}</span>`;
        }
    });

    // 3. Use Marked.js for full Markdown
    try {
        return marked.parse(preProcessed);
    } catch (e) {
        console.error("Markdown parsing failed:", e);
        return `<p>${preProcessed}</p>`;
    }
}

// Start
init();