export default class JournalManager {
    constructor(api) {
        this.api = api;
        this.currentReading = { cards: [] };
        this.setupModal();
    }

    // --- DISPLAY LIST ---
    async loadReadingsList() {
        const container = document.getElementById('readings-list');
        // Simple loading state
        if (!container.querySelector('.loading-state')) {
            container.innerHTML = '<div class="loading-state">Loading...</div>';
        }
        
        const data = await this.api.getReadings();
        container.innerHTML = '';

        if(data.readings.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted)">No readings found.</p>';
            return;
        }

        data.readings.forEach(r => {
            const date = new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const div = document.createElement('div');
            div.className = 'reading-item';
            div.innerHTML = `
                <div class="reading-meta">
                    <span><i class="ph ph-calendar"></i> ${date}</span>
                    <span><i class="ph ph-cards"></i> ${r.cards.length} Cards</span>
                </div>
                <h3>${r.spreadId?.name || 'Quick Draw'}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem;">${r.question || 'No question recorded'}</p>
                <div style="margin-top: 10px;">
                    ${r.tags.map(t => `<span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-right: 4px;">#${t.trim()}</span>`).join('')}
                </div>
            `;
            container.appendChild(div);
        });
    }

    // --- NEW READING FLOW ---
    startNewReading() {
        const select = document.getElementById('reading-spread-select');
        select.innerHTML = '<option value="">Select a Layout...</option>';
        this.api.spreads.forEach(s => {
            select.innerHTML += `<option value="${s._id}">${s.name}</option>`;
        });

        // Clear Inputs
        document.getElementById('reading-question').value = '';
        document.getElementById('reading-tags').value = '';
        document.getElementById('reading-notes').value = '';
        document.getElementById('reading-table').innerHTML = '<div class="empty-state">Select a spread to begin</div>';
        
        select.onchange = (e) => this.renderSpreadTemplate(e.target.value);
    }

    renderSpreadTemplate(spreadId) {
        const spread = this.api.spreads.find(s => s._id === spreadId);
        if (!spread) return;

        const table = document.getElementById('reading-table');
        table.innerHTML = '';
        this.currentReading = { spreadId: spreadId, cards: [] };

        spread.positions.forEach(pos => {
            const el = document.createElement('div');
            el.className = 'card-slot';
            el.dataset.posId = pos.id;
            // Use spread position name (e.g., "The Challenge")
            el.innerHTML = `<span>${pos.name || pos.id}</span>`;
            
            el.style.left = `${pos.x}%`;
            el.style.top = `${pos.y}%`;
            el.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg)`;

            el.onclick = () => this.openCardSelector(pos.id, el);
            table.appendChild(el);
        });
    }

    // --- CARD SELECTION ---
    setupModal() {
        this.modal = document.getElementById('card-modal');
        const closeBtn = document.querySelector('.close-modal');
        if(closeBtn) closeBtn.onclick = () => this.modal.classList.add('hidden');
    }

    populateCardGrid() {
        const grid = document.getElementById('card-grid-select');
        grid.innerHTML = '';
        this.api.cards.forEach(card => {
            const div = document.createElement('div');
            div.className = 'card-select-item';
            div.innerText = card.name;
            div.onclick = () => this.selectCard(card);
            grid.appendChild(div);
        });
    }

    openCardSelector(posId, domElement) {
        this.activeSlot = { posId, domElement };
        const grid = document.getElementById('card-grid-select');
        if(grid.children.length === 0) {
            this.populateCardGrid();
        }
        this.modal.classList.remove('hidden');
    }

    selectCard(card) {
        const isReversed = document.getElementById('card-reversed').checked;
        
        // Update Data
        this.currentReading.cards = this.currentReading.cards.filter(c => c.positionId !== this.activeSlot.posId);
        this.currentReading.cards.push({
            positionId: this.activeSlot.posId,
            cardId: card._id,
            orientation: isReversed ? 'reversed' : 'upright'
        });

        // Update UI (Slot)
        this.activeSlot.domElement.classList.add('filled');
        this.activeSlot.domElement.innerHTML = `
            <div style="font-size: 0.9rem; font-weight: bold;">${card.name}</div>
            <div style="font-size: 0.7rem; opacity: 0.7;">${isReversed ? 'Reversed' : 'Upright'}</div>
        `;
        if(isReversed) {
            this.activeSlot.domElement.style.transform += ' rotate(180deg)'; 
        }

        // Update Sidebar Info
        const detailsPanel = document.getElementById('selected-card-details');
        detailsPanel.innerHTML = `
            <h4 style="color:var(--primary); font-family:var(--font-serif)">${card.name}</h4>
            <p style="font-size:0.8rem; margin-top:4px;">${card.suit} • ${isReversed ? 'Reversed' : 'Upright'}</p>
            <p style="margin-top:8px; font-size:0.9rem;">${isReversed ? card.defaultMeanings.reversed[0] : card.defaultMeanings.upright[0]}</p>
        `;

        this.modal.classList.add('hidden');
        document.getElementById('card-reversed').checked = false;
    }

    async saveEntry() {
        const question = document.getElementById('reading-question').value;
        const notes = document.getElementById('reading-notes').value;
        const tagsVal = document.getElementById('reading-tags').value;
        const tags = tagsVal ? tagsVal.split(',') : [];

        if(!this.currentReading.spreadId) return alert("Please select a spread first.");

        const payload = {
            ...this.currentReading,
            question,
            notes,
            tags
        };

        await this.api.saveReading(payload);
    }
}