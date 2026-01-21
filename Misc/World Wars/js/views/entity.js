import { API } from '../api.js';
import { State } from '../state.js';
import { parseContent, showDeleteModal } from '../utils.js';

export async function renderEntityPage(container, slug) {
    container.innerHTML = '<div class="loading">Loading Scroll...</div>';
    const data = await API.getEntity(slug);
    
    if (!data) { container.innerHTML = '<h1>404 - Not Found</h1>'; return; }

    const template = document.getElementById('event-page-template');
    const page = template.content.cloneNode(true);

    // Metadata
    page.querySelector('#t-title').textContent = data.title;
    const metaBar = page.querySelector('.meta-bar');
    let metaHTML = [data.dateDisplay || data.year, data.location].filter(Boolean).join(' · ');
    if (metaHTML) metaBar.innerHTML = metaHTML; else metaBar.style.display = 'none';

    // Takeaway
    if (data.takeaway) page.querySelector('#t-takeaway').textContent = data.takeaway;
    else page.querySelector('.takeaway-card')?.remove();
    
    page.querySelector('#t-era').textContent = data.era;
    page.querySelector('article').setAttribute('data-era', data.era);

    // Connections & Backlinks
    const connectionsPanel = page.querySelector('.connections-panel');
    connectionsPanel.innerHTML = ''; 

    const isValid = c => (c.target && c.target.slug) || c.targetSlug;
    const renderLinks = list => list.map(c => `<a href="#/entity/${c.target?.slug || c.targetSlug}" class="link-card">→ ${c.target?.title || c.targetTitle || 'Unknown'}</a>`).join('');
    const addSection = (title, list) => {
        if (list?.length) {
            const h4 = document.createElement('h4'); h4.textContent = title; connectionsPanel.appendChild(h4);
            const div = document.createElement('div'); div.className = 'link-list'; div.innerHTML = renderLinks(list); connectionsPanel.appendChild(div);
        }
    };

    const conns = data.connections || [];
    addSection('Caused By', conns.filter(c => c.type === 'caused_by' && isValid(c)));
    addSection('Leads To', conns.filter(c => c.type === 'leads_to' && isValid(c)));
    addSection('Participated In', conns.filter(c => c.type === 'participated_in' && isValid(c)));
    addSection(data.type === 'actor' ? "Allies / Rivals" : "Related Events", conns.filter(c => c.type === 'related_to' && isValid(c)));

    // BACKLINKS (Dropdown Style)
    const backlinks = State.atlas.filter(e => e.connections?.some(c => c.target === data._id || c.targetSlug === data.slug));
    if (backlinks.length) {
        const details = document.createElement('details');
        details.style.cssText = "margin-top: 1.5rem; border-top: 1px solid #e9ecef; padding-top: 1rem;";
        
        const summary = document.createElement('summary');
        // Match style of other h4 headers in the panel
        summary.innerHTML = `<span style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--era-ww1);">Linked From (${backlinks.length})</span>`;
        summary.style.cursor = 'pointer';
        summary.style.outline = 'none';
        
        const div = document.createElement('div'); 
        div.className = 'link-list'; 
        div.style.marginTop = '0.75rem';
        div.innerHTML = renderLinks(backlinks.map(b => ({ target: { slug: b.slug, title: b.title } })));
        
        details.appendChild(summary);
        details.appendChild(div);
        connectionsPanel.appendChild(details);
    }

    // Layout Adjustment
    const hasConns = connectionsPanel.children.length > 0;
    const hasTakeaway = !!data.takeaway;
    
    // Check if backlink logic added content to panel or if native connections did
    if (!hasConns && !hasTakeaway) {
        page.querySelector('.context-column')?.remove();
        page.querySelector('.split-layout').style.gridTemplateColumns = '1fr';
    } else if (!hasConns) {
        connectionsPanel.remove();
    }

    // Content & Summary
    // FIX: Always remove the default summary box. 
    // We rely 100% on parseContent() to render the summary block if it exists in the markdown.
    page.querySelector('.summary-box')?.remove();

    page.querySelector('#t-content').innerHTML = parseContent(data.content || '');

    // Admin
    if (State.currentUser) {
        const controls = document.createElement('div');
        Object.assign(controls.style, { position: 'absolute', top: '0', right: '0', display: 'flex', gap: '0.5rem' });
        
        const btnStyle = `background:none; border:none; cursor:pointer; padding:0.5rem; opacity:0.6; transition:opacity 0.2s;`;
        const createBtn = (icon, color, action) => {
            const btn = document.createElement('button');
            btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${icon}"></path></svg>`;
            btn.style.cssText = btnStyle; btn.style.color = color;
            btn.onclick = (e) => { e.stopPropagation(); action(); };
            btn.onmouseenter = () => btn.style.opacity = '1';
            btn.onmouseleave = () => btn.style.opacity = '0.6';
            return btn;
        };

        controls.appendChild(createBtn("M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z", "var(--era-ww1)", () => window.location.hash = `#/edit/${data.slug}`));
        
        const delBtn = createBtn("", "#dc3545", () => { showDeleteModal(data.title, async () => { await API.deleteEntity(data.slug); await API.getAtlas().then(d => State.setAtlas(d)); window.location.hash = '#/'; }); });
        delBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
        controls.appendChild(delBtn);

        page.querySelector('.event-header').appendChild(controls);
        page.querySelector('.event-header').style.position = 'relative';
    }

    container.innerHTML = '';
    container.appendChild(page);
}