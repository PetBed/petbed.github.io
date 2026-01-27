export default class JournalManager {
    constructor(api) {
        this.api = api;
        this.currentReading = { cards: [] };
        this.editingId = null; 
        this.isFreeForm = false;
        this.setupModal();
    }

    async loadReadingsList() {
        const container = document.getElementById('readings-list');
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
            const spreadName = r.spreadId ? r.spreadId.name : 'Free Form'; 
            const div = document.createElement('div');
            div.className = 'reading-item';
            div.innerHTML = `
                <div class="reading-meta">
                    <span><i class="ph ph-calendar"></i> ${date}</span>
                    <span><i class="ph ph-cards"></i> ${r.cards.length} Cards</span>
                </div>
                <h3>${spreadName}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem;">${r.question || 'No question recorded'}</p>
                <div style="margin-top: 10px;">
                    ${r.tags.map(t => `<span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-right: 4px;">#${t.trim()}</span>`).join('')}
                </div>
            `;
            div.onclick = () => this.openReading(r);
            container.appendChild(div);
        });
    }

    startNewReading() {
        this.editingId = null; 
        this.isFreeForm = false;
        
        // Hide Delete Button for new entries
        const delBtn = document.getElementById('btn-delete-reading');
        if(delBtn) delBtn.classList.add('hidden');
        
        const select = document.getElementById('reading-spread-select');
        let options = '<option value="">Select a Layout...</option>';
        options += '<option value="freeform" style="color: var(--primary); font-weight: bold;">✨ No Layout / Free Form</option>';
        
        this.api.spreads.forEach(s => {
            options += `<option value="${s._id}">${s.name}</option>`;
        });
        select.innerHTML = options;

        document.getElementById('reading-question').value = '';
        document.getElementById('reading-tags').value = '';
        document.getElementById('reading-notes').value = '';
        document.getElementById('reading-table').innerHTML = '<div class="empty-state">Select a spread to begin</div>';
        document.getElementById('reading-table').className = 'tarot-table'; 
        
        document.getElementById('selected-card-details').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted); border: 1px dashed var(--border-subtle); border-radius: 8px; background: rgba(255,255,255,0.02);">
                <i class="ph ph-hand-tap" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
                <p style="font-size: 0.9rem; margin: 0;">Select a card on the table to view details</p>
            </div>
        `;
        
        select.onchange = (e) => {
            if (e.target.value === 'freeform') {
                this.renderFreeForm();
            } else {
                this.renderSpreadTemplate(e.target.value);
            }
        };
    }

    openReading(reading) {
        this.editingId = reading._id;
        
        const delBtn = document.getElementById('btn-delete-reading');
        if(delBtn) delBtn.classList.remove('hidden');
        
        document.getElementById('reading-question').value = reading.question || '';
        document.getElementById('reading-tags').value = reading.tags ? reading.tags.join(', ') : '';
        document.getElementById('reading-notes').value = reading.notes || '';
        
        document.getElementById('view-readings').classList.remove('active');
        document.getElementById('view-reading-editor').classList.remove('hidden');
        
        const select = document.getElementById('reading-spread-select');
        let options = '<option value="">Select a Layout...</option>';
        const isFreeForm = !reading.spreadId;
        
        options += `<option value="freeform" ${isFreeForm ? 'selected' : ''} style="color: var(--primary); font-weight: bold;">✨ No Layout / Free Form</option>`;
        
        this.api.spreads.forEach(s => {
            const selected = (reading.spreadId && (reading.spreadId._id === s._id || reading.spreadId === s._id)) ? 'selected' : '';
            options += `<option value="${s._id}" ${selected}>${s.name}</option>`;
        });
        select.innerHTML = options;
        
        select.onchange = (e) => {
            if (e.target.value === 'freeform') this.renderFreeForm();
            else this.renderSpreadTemplate(e.target.value);
        };

        if (isFreeForm) {
            this.currentReading = { spreadId: null, cards: reading.cards || [] };
            this.renderFreeForm();
        } else {
            const spreadId = reading.spreadId._id || reading.spreadId;
            this.renderSpreadTemplate(spreadId, reading.cards);
        }
    }

    renderFreeForm() {
        this.isFreeForm = true;
        this.currentReading.spreadId = null; 
        
        const table = document.getElementById('reading-table');
        table.innerHTML = '';
        table.className = 'tarot-table free-form'; 

        this.currentReading.cards.forEach((cardEntry, index) => {
            cardEntry.positionId = index;
            const cardInfo = this.api.cards.find(c => c._id === cardEntry.cardId);
            const el = document.createElement('div');
            el.className = 'card-slot';
            el.dataset.posId = index;
            
            table.appendChild(el);
            if (cardInfo) {
                this.updateSlotUI(el, cardInfo, cardEntry.orientation === 'reversed');
            }
            
            // [NEW] Append Remove Button
            const removeBtn = document.createElement('div');
            removeBtn.className = 'remove-card-btn';
            removeBtn.innerHTML = '<i class="ph ph-x"></i>';
            removeBtn.onclick = (e) => {
                e.stopPropagation(); // Stop bubbling to select handler
                this.removeCardFromFreeForm(index);
            };
            el.appendChild(removeBtn);
            
            el.onclick = () => this.openCardSelector(index, el);
        });

        const addBtn = document.createElement('div');
        addBtn.className = 'card-slot add-btn';
        addBtn.innerHTML = '<i class="ph ph-plus" style="font-size: 2rem;"></i>';
        addBtn.onclick = () => {
            const newPosId = this.currentReading.cards.length;
            this.openCardSelector(newPosId, addBtn);
        };
        table.appendChild(addBtn);
    }

    // [NEW] Helper to remove card
    removeCardFromFreeForm(index) {
        this.currentReading.cards.splice(index, 1);
        // Re-index logic handled by re-rendering
        this.renderFreeForm();
    }

    renderSpreadTemplate(spreadId, existingCards = []) {
        this.isFreeForm = false;
        const spread = this.api.spreads.find(s => s._id === spreadId);
        if (!spread) return;

        const table = document.getElementById('reading-table');
        table.innerHTML = '';
        table.className = 'tarot-table'; 
        
        this.currentReading = { spreadId: spreadId, cards: [] };

        spread.positions.forEach(pos => {
            const el = document.createElement('div');
            el.className = 'card-slot';
            el.dataset.posId = pos.id;
            el.innerHTML = `<span>${pos.name || pos.id}</span>`;
            
            el.style.left = `${pos.x}%`;
            el.style.top = `${pos.y}%`;
            el.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg)`;

            el.onclick = () => this.openCardSelector(pos.id, el);
            table.appendChild(el);

            const existing = existingCards.find(c => c.positionId === pos.id);
            if (existing) {
                const cardInfo = this.api.cards.find(c => c._id === existing.cardId);
                if (cardInfo) {
                    this.updateSlotUI(el, cardInfo, existing.orientation === 'reversed');
                    this.currentReading.cards.push({
                        positionId: pos.id,
                        cardId: existing.cardId,
                        orientation: existing.orientation
                    });
                }
            }
        });
    }

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
        this.activeSlot = { posId: parseInt(posId), domElement };
        const grid = document.getElementById('card-grid-select');
        if(grid.children.length === 0) {
            this.populateCardGrid();
        }
        this.modal.classList.remove('hidden');
    }

    selectCard(card) {
        const isReversed = document.getElementById('card-reversed').checked;
        const posId = this.activeSlot.posId;

        if (this.isFreeForm) {
            const existingIndex = this.currentReading.cards.findIndex(c => c.positionId === posId);
            const cardData = {
                positionId: posId,
                cardId: card._id,
                orientation: isReversed ? 'reversed' : 'upright'
            };

            if (existingIndex >= 0) {
                this.currentReading.cards[existingIndex] = cardData;
            } else {
                this.currentReading.cards.push(cardData);
            }
            this.renderFreeForm();
        } else {
            this.currentReading.cards = this.currentReading.cards.filter(c => c.positionId !== posId);
            this.currentReading.cards.push({
                positionId: posId,
                cardId: card._id,
                orientation: isReversed ? 'reversed' : 'upright'
            });
            this.updateSlotUI(this.activeSlot.domElement, card, isReversed);
        }

        this.modal.classList.add('hidden');
        document.getElementById('card-reversed').checked = false;
        this.showCardDetails(card, isReversed);
    }

    updateSlotUI(element, card, isReversed) {
        element.classList.add('filled');
        const note = this.api.notes[card._id];
        const imageUrl = (note && note.customImage) ? note.customImage : card.image;

        if(imageUrl) {
             element.style.backgroundImage = `url('${imageUrl}')`;
             element.style.backgroundSize = 'cover';
             element.innerHTML = ''; 
        } else {
            element.innerHTML = `
                <div style="font-size: 0.8rem; font-weight: bold;">${card.name}</div>
                <div style="font-size: 0.6rem; opacity: 0.7;">${isReversed ? 'Rev.' : 'Up.'}</div>
            `;
        }

        if (this.isFreeForm) {
            if(isReversed) element.classList.add('is-reversed');
            else element.classList.remove('is-reversed');
            element.style.transform = ''; 
        } else {
            const baseRotation = element.style.transform.match(/rotate\(([-0-9.]+)deg\)/);
            let rotation = baseRotation ? parseFloat(baseRotation[1]) : 0;
            
            if (isReversed) {
                if (!element.classList.contains('is-reversed')) {
                    rotation += 180;
                    element.classList.add('is-reversed');
                }
            } else {
                 if (element.classList.contains('is-reversed')) {
                    rotation -= 180;
                    element.classList.remove('is-reversed');
                }
            }
            element.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        }
        
        element.onclick = (e) => {
            e.stopPropagation(); 
            this.showCardDetails(card, isReversed);
            this.openCardSelector(element.dataset.posId, element);
        };
    }

    showCardDetails(card, isReversed) {
        const detailsPanel = document.getElementById('selected-card-details');
        const note = this.api.notes[card._id];
        
        const meanings = isReversed ? card.defaultMeanings.reversed : card.defaultMeanings.upright;
        const noteKeywords = note ? (isReversed ? note.keywordsReversed : note.keywordsUpright) : '';
        
        let keywordArray = [];
        if (noteKeywords) {
            keywordArray = noteKeywords.split(',').map(k => k.trim()).filter(k => k);
        } else {
            keywordArray = meanings;
        }
        
        detailsPanel.innerHTML = `
            <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 1.25rem; border: 1px solid var(--border-subtle); margin-bottom: 1rem;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="color:var(--primary); font-family:var(--font-serif); font-size: 1.1rem; margin-bottom: 2px; margin-top: 0;">${card.name}</h4>
                        <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">${card.suit}</span>
                    </div>
                    <span style="font-size:0.75rem; padding: 2px 8px; border-radius: 12px; background: ${isReversed ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)'}; color: ${isReversed ? '#e74c3c' : '#2ecc71'};">
                        ${isReversed ? 'Reversed' : 'Upright'}
                    </span>
                </div>

                <div style="margin-bottom: 1rem;">
                    <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom: 6px;">Keywords</span>
                    <div style="display:flex; flex-wrap:wrap; gap: 6px;">
                        ${keywordArray.map(k => 
                            `<span style="font-size: 0.8rem; background: var(--bg-app); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-subtle);">${k}</span>`
                        ).join('')}
                    </div>
                </div>

                ${note && note.meaning ? `
                <div style="padding-top: 1rem; border-top: 1px dashed var(--border-subtle);">
                    <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom: 6px;">My Notes</span>
                    <p style="font-size:0.85rem; color:var(--text-main); line-height:1.5; margin:0; font-style:italic;">"${note.meaning.substring(0, 150)}${note.meaning.length > 150 ? '...' : ''}"</p>
                </div>` : ''}
            </div>
        `;
    }

    async saveEntry() {
        const question = document.getElementById('reading-question').value;
        const notes = document.getElementById('reading-notes').value;
        const tagsVal = document.getElementById('reading-tags').value;
        const tags = tagsVal ? tagsVal.split(',').map(t => t.trim()) : [];

        if(!this.isFreeForm && !this.currentReading.spreadId) return alert("Please select a spread first.");

        const payload = {
            ...this.currentReading,
            question,
            notes,
            tags
        };

        try {
            if (this.editingId) {
                await this.api.updateReading(this.editingId, payload);
                alert("Reading Updated!");
            } else {
                await this.api.saveReading(payload);
                alert("Reading Saved!");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving reading");
        }
    }

    async deleteCurrentEntry() {
        if (!this.editingId) return;
        
        if (confirm("Are you sure you want to delete this reading? This cannot be undone.")) {
            try {
                await this.api.deleteReading(this.editingId);
                alert("Reading Deleted.");
                
                document.getElementById('view-reading-editor').classList.add('hidden');
                document.getElementById('view-readings').classList.add('active');
                this.loadReadingsList();
                
            } catch (e) {
                console.error(e);
                alert("Error deleting reading.");
            }
        }
    }
}