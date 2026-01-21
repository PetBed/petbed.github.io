import { API } from '../api.js';
import { State } from '../state.js';
import { setupWikiLinkAutocomplete, setupTagInput } from '../utils.js';

export function renderNewEntrySelector(container, onSelect) {
    container.innerHTML = `
        <div class="selection-container" style="max-width: 800px; margin: 4rem auto; text-align: center;">
            <h1 style="font-family: var(--font-reading); color: var(--text-main);">Create New Entry</h1>
            <p style="color: var(--text-muted); margin-bottom: 3rem;">Select the type of history entry you want to create.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem;">
                ${['event', 'actor', 'context', 'theme'].map(type => `
                    <div class="type-card" data-type="${type}" style="padding: 2rem; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; background: var(--card-bg); transition: all 0.2s;">
                        <h3 style="margin: 0; color: var(--text-main); text-transform: capitalize;">${type}</h3>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.querySelectorAll('.type-card').forEach(card => {
        card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-5px)'; card.style.boxShadow = '0 10px 20px var(--shadow-color)'; card.style.borderColor = 'var(--era-ww1)'; });
        card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; card.style.borderColor = 'var(--border-color)'; });
        card.addEventListener('click', () => onSelect(card.dataset.type));
    });
}

function setupToolbar(textarea, toolbar) {
    if (!textarea || !toolbar) return;

    toolbar.addEventListener('click', (e) => {
        if (!e.target.classList.contains('toolbar-btn')) return;
        e.preventDefault(); // Prevent form submission if button is inside form

        const action = e.target.dataset.action;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        
        let insertion = '';
        let cursorOffset = 0;

        switch(action) {
            case 'bold':
                insertion = `**${selected}**`;
                cursorOffset = selected ? 0 : -2; // if no selection, put cursor inside
                break;
            case 'italic':
                insertion = `*${selected}*`;
                cursorOffset = selected ? 0 : -1;
                break;
            case 'h2':
                insertion = `\n## ${selected}`;
                break;
            case 'h3':
                insertion = `\n### ${selected}`;
                break;
            case 'list':
                insertion = `\n- ${selected}`;
                break;
            case 'link':
                insertion = `[[${selected}]]`;
                cursorOffset = selected ? 0 : -2;
                break;
        }

        // Apply change
        const before = text.substring(0, start);
        const after = text.substring(end);
        textarea.value = before + insertion + after;

        // Restore focus and trigger input for autosave
        textarea.focus();
        
        // Adjust cursor position based on action
        const newCursorPos = start + insertion.length + cursorOffset;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

export function renderEditor(container, type = 'event', existingData = null) {
    const v = (key) => existingData ? (existingData[key] || '') : '';
    
    const cValArray = (connType) => {
        if (!existingData || !existingData.connections) return [];
        return existingData.connections
            .filter(c => c.type === connType)
            .map(c => c.targetTitle || 'Unknown');
    };

    const isSel = (val) => (existingData && existingData.era === val) ? 'selected' : '';

    let headerExtra = '', sidebarInputs = '', contentPlaceholder = '';
    let takeawayLabel = "The Takeaway", takeawayPlaceholder = "One sentence: Why does this matter?";

    if (type === 'event') {
        contentPlaceholder = `::: summary\nWrite a brief 1-2 paragraph summary here...\n:::\n\nDescribe the sequence of events...`;
        headerExtra = `
            <input type="text" name="dateDisplay" value="${v('dateDisplay')}" placeholder="Display Date (e.g. June 28)" style="flex-grow: 1; padding: 0.25rem; border-radius: 4px;">
            <span>·</span>
            <input type="text" name="location" value="${v('location')}" placeholder="Location" style="flex-grow: 1; padding: 0.25rem; border-radius: 4px;">`;
        
        sidebarInputs = `
            <div class="form-group"><label>Caused By</label><div id="tag-caused-by"></div></div>
            <div class="form-group"><label>Leads To</label><div id="tag-leads-to"></div></div>
            <div class="form-group"><label>Related Events</label><div id="tag-related-to"></div></div>`;
    } 
    else if (type === 'actor') {
        contentPlaceholder = `::: summary\nMotivations & Fears (Not biography). What drives them?\n:::\n\n### Constraints\nWhat limits them?\n\n### Key Decisions\n- Decision 1\n\n### Biography\n...`;
        takeawayLabel = "Narrative Role"; takeawayPlaceholder = "e.g. Antagonist";
        headerExtra = `<input type="text" name="location" value="${v('location')}" placeholder="Origin / State" style="flex-grow: 1; padding: 0.25rem; border-radius: 4px;">`;
        sidebarInputs = `
            <div class="form-group"><label>Relationships</label><div id="tag-related-to"></div></div>
            <div class="form-group"><label>Participated In</label><div id="tag-participated-in"></div></div>`;
    } 
    else if (type === 'context') {
        contentPlaceholder = `::: summary\nDefinition: What is this force?\n:::\n\n### Origins\nWhy does it exist?\n\n### Mechanism\nHow does it shape events?\n\n### Evolution\nHow has it changed?`;
        takeawayLabel = null;
        headerExtra = `<input type="text" name="location" value="${v('location')}" placeholder="Region / Scope" style="flex-grow: 1; padding: 0.25rem; border-radius: 4px;">`;
        sidebarInputs = `<div class="form-group"><label>Related Entries</label><div id="tag-related-to"></div></div>`;
    } 
    else {
        contentPlaceholder = `::: summary\nDefine the theme...\n:::\n\nWhere does this appear in history?`;
        sidebarInputs = `<div class="form-group"><label>Related Entries</label><div id="tag-related-to"></div></div>`;
    }

    const editorContent = existingData ? existingData.content : contentPlaceholder;

    container.innerHTML = `
        <article class="event-page">
            <form id="editor-form">
                <header class="event-header" style="border-bottom: 2px dashed var(--border-color); padding-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <div style="padding: 0.5rem; border-radius: 4px; background: var(--hover-bg); font-weight: 600; text-transform: uppercase;">${type}<input type="hidden" name="type" value="${type}"></div>
                        <select name="era" style="padding: 0.5rem; border-radius: 4px; font-weight: bold;">
                            <option value="pre-ww1" ${isSel('pre-ww1')}>Pre-WWI</option>
                            <option value="ww1" ${isSel('ww1')}>WWI</option>
                            <option value="interwar" ${isSel('interwar')}>Interwar</option>
                            <option value="ww2" ${isSel('ww2')}>WWII</option>
                            <option value="post-ww2" ${isSel('post-ww2')}>Post-WWII</option>
                        </select>
                    </div>
                    <input type="text" name="title" value="${v('title')}" required placeholder="Enter Title..." style="width: 100%; font-size: 2.5rem; border: none; border-bottom: 1px solid var(--border-color); outline: none; background: transparent; color: var(--text-main);">
                    <div class="meta-bar" style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                        <input type="number" name="year" value="${v('year')}" placeholder="Year" required style="width: 100px; padding: 0.25rem; border-radius: 4px;">
                        ${headerExtra}
                    </div>
                </header>
                <div class="split-layout">
                    <div class="narrative-column">
                        <div class="content-body" style="height: 100%;">
                            <label style="display:block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">EDITOR</label>
                            
                            <!-- MARKDOWN TOOLBAR -->
                            <div class="markdown-toolbar">
                                <button type="button" class="toolbar-btn" data-action="bold" title="Bold">B</button>
                                <button type="button" class="toolbar-btn" data-action="italic" title="Italic">I</button>
                                <button type="button" class="toolbar-btn" data-action="h2" title="Heading 2">H2</button>
                                <button type="button" class="toolbar-btn" data-action="h3" title="Heading 3">H3</button>
                                <button type="button" class="toolbar-btn" data-action="list" title="List">• List</button>
                                <button type="button" class="toolbar-btn" data-action="link" title="Wiki Link">[[ Link ]]</button>
                            </div>

                            <textarea name="content" required rows="25" style="width: 100%; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 1rem; line-height: 1.6; resize: vertical; min-height: 60vh;">${editorContent}</textarea>
                        </div>
                    </div>
                    <aside class="context-column">
                        ${takeawayLabel ? `<div class="takeaway-card" style="margin-bottom: 2rem;"><h4>${takeawayLabel}</h4><textarea name="takeaway" placeholder="${takeawayPlaceholder}" rows="3" style="width: 100%; border: none; resize: vertical; background: transparent;">${v('takeaway')}</textarea></div>` : ''}
                        <div class="connections-panel" style="background: var(--hover-bg); padding: 1.5rem; border-radius: 8px;">
                            <h4 style="margin-top:0;">Connections</h4>
                            ${sidebarInputs}
                            <button type="submit" class="btn-primary" style="width: 100%; padding: 1rem; margin-top: 1rem;">Save Entry</button>
                        </div>
                    </aside>
                </div>
            </form>
        </article>
    `;

    // --- INITIALIZE UI ---
    setupWikiLinkAutocomplete(container.querySelector('textarea[name="content"]'));
    setupToolbar(container.querySelector('textarea[name="content"]'), container.querySelector('.markdown-toolbar'));

    // Initialize Tag Inputs based on what DOM elements exist
    const initTag = (id, name, type) => {
        const el = container.querySelector(id);
        if (el) setupTagInput(el, name, cValArray(type));
    };

    initTag('#tag-caused-by', 'conn_caused_by', 'caused_by');
    initTag('#tag-leads-to', 'conn_leads_to', 'leads_to');
    initTag('#tag-related-to', 'conn_related_to', 'related_to');
    initTag('#tag-participated-in', 'conn_participated_in', 'participated_in');

    // --- AUTOSAVE & RESTORE LOGIC ---
    const form = document.getElementById('editor-form');
    const draftId = existingData ? existingData.slug : 'new';
    const draftKey = `archive_draft_${type}_${draftId}`;

    const savedJson = localStorage.getItem(draftKey);
    if (savedJson) {
        try {
            const draft = JSON.parse(savedJson);
            const banner = document.createElement('div');
            Object.assign(banner.style, {
                background: '#fff3cd', color: '#856404', padding: '1rem',
                marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ffeeba',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            });
            banner.innerHTML = `
                <span><strong>Unsaved Draft Found:</strong> ${new Date(draft._timestamp).toLocaleTimeString()}</span>
                <div><button id="btn-restore" style="margin-right:0.5rem;">Restore</button><button id="btn-discard">Discard</button></div>
            `;
            const header = form.querySelector('.event-header');
            header.parentNode.insertBefore(banner, header.nextSibling);

            banner.querySelector('#btn-restore').addEventListener('click', (e) => {
                e.preventDefault();
                // Restore form elements
                Object.keys(draft).forEach(key => {
                    if (form.elements[key]) form.elements[key].value = draft[key];
                });
                
                // Re-initialize tag inputs with draft data if available
                if (draft['conn_caused_by']) setupTagInput(container.querySelector('#tag-caused-by'), 'conn_caused_by', draft['conn_caused_by'].split(', ').filter(Boolean));
                if (draft['conn_leads_to']) setupTagInput(container.querySelector('#tag-leads-to'), 'conn_leads_to', draft['conn_leads_to'].split(', ').filter(Boolean));
                if (draft['conn_related_to']) setupTagInput(container.querySelector('#tag-related-to'), 'conn_related_to', draft['conn_related_to'].split(', ').filter(Boolean));
                if (draft['conn_participated_in']) setupTagInput(container.querySelector('#tag-participated-in'), 'conn_participated_in', draft['conn_participated_in'].split(', ').filter(Boolean));

                banner.remove();
            });

            banner.querySelector('#btn-discard').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem(draftKey);
                banner.remove();
            });
        } catch(e) { console.error("Draft error:", e); }
    }

    form.addEventListener('input', () => {
        // Tag inputs trigger 'change' event on hidden input, which bubbles up
        const formData = new FormData(form);
        const draftData = Object.fromEntries(formData.entries());
        draftData._timestamp = Date.now();
        localStorage.setItem(draftKey, JSON.stringify(draftData));
    });

    // --- SUBMIT HANDLER ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const contentRaw = fd.get('content');
        
        let summaryText = contentRaw.match(/:::\s*summary\s*([\s\S]*?)\s*:::/i)?.[1]?.trim() || contentRaw.substring(0, 200) + "...";

        const data = {
            title: fd.get('title'), type: fd.get('type'), era: fd.get('era'), year: fd.get('year'),
            dateDisplay: fd.get('dateDisplay'), location: fd.get('location'),
            summary: summaryText, content: contentRaw, takeaway: fd.get('takeaway'),
            connections: []
        };

        const processConnections = (inputStr, type) => {
            if (!inputStr) return;
            inputStr.split(',').map(t => t.trim()).forEach(title => {
                const match = State.atlas.find(a => a.title.toLowerCase() === title.toLowerCase());
                if (match) data.connections.push({ target: match._id, targetTitle: match.title, targetSlug: match.slug, type });
            });
        };

        ['caused_by', 'leads_to', 'related_to', 'participated_in'].forEach(type => processConnections(fd.get(`conn_${type}`), type));
        
        try {
            const saved = await API.saveEntity(data);
            localStorage.removeItem(draftKey);
            alert('Saved!');
            await API.getAtlas().then(data => State.setAtlas(data)); 
            window.location.hash = `#/entity/${saved.slug}`;
        } catch (err) { alert('Error: ' + err.message); }
    });
}