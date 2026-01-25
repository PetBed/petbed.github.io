export default class DeckManager {
    constructor(api) {
        this.api = api;
        this.container = document.getElementById('deck-grid');
        this.editorView = document.getElementById('view-card-editor');
        this.currentCardId = null;
        
        this.setupEditorEvents();
    }

    setupEditorEvents() {
        // 1. URL Input Listener
        const urlInput = document.getElementById('note-image-url');
        if(urlInput) {
            urlInput.addEventListener('input', (e) => this.updateEditorPreview(e.target.value));
        }

        // 2. File Upload Button Trigger
        const btnUpload = document.getElementById('btn-trigger-upload');
        const fileInput = document.getElementById('note-image-file');
        if(btnUpload && fileInput) {
            btnUpload.onclick = () => fileInput.click();
            
            // 3. File Input Listener (Base64 Conversion)
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    // Set it to the text input so it acts as the "source of truth"
                    document.getElementById('note-image-url').value = base64; 
                    this.updateEditorPreview(base64);
                };
                reader.readAsDataURL(file);
            };
        }
    }

    renderLibrary() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const majors = this.api.cards.filter(c => c.suit === 'Major');
        const minors = this.api.cards.filter(c => c.suit !== 'Major');

        if (majors.length > 0) {
            this.renderSectionHeader("Major Arcana", "ph-crown");
            majors.forEach(card => this.renderCard(card));
        }

        if (minors.length > 0) {
            this.renderSectionHeader("Minor Arcana", "ph-sword");
            minors.forEach(card => this.renderCard(card));
        }
    }

    renderSectionHeader(title, iconClass) {
        const header = document.createElement('div');
        header.className = 'deck-section-header';
        header.innerHTML = `<h2><i class="ph ${iconClass}"></i> ${title}</h2>`;
        this.container.appendChild(header);
    }

    renderCard(card) {
        const note = this.api.notes[card._id];
        const hasNotes = note ? 'has-notes' : '';
        
        // Prioritize Custom Image -> Default Image
        const imageUrl = (note && note.customImage) ? note.customImage : card.image;
        
        let imageHtml = `<div class="card-placeholder-thumb"><i class="ph ph-image"></i></div>`;
        if (imageUrl) {
            imageHtml = `<img src="${imageUrl}" alt="${card.name}" class="card-thumb" onerror="this.style.display='none'; this.previousElementSibling.style.display='flex'">`;
        }

        const cardEl = document.createElement('div');
        cardEl.className = `deck-card-item ${hasNotes}`;
        cardEl.innerHTML = `
            ${imageHtml}
            <div class="card-content">
                <div class="card-number">${this.formatNumber(card)}</div>
                <h3>${card.name}</h3>
                <!-- Suit subtitle removed -->
            </div>
            ${note ? '<div class="note-indicator"><i class="ph ph-notebook"></i></div>' : ''}
        `;
        cardEl.onclick = () => this.openEditor(card);
        this.container.appendChild(cardEl);
    }

    formatNumber(card) {
        if (card.suit === 'Major') return ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'][card.number] || card.number;
        return card.number;
    }

    openEditor(card) {
        this.currentCardId = card._id;
        const note = this.api.notes[card._id] || {};

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        this.editorView.classList.remove('hidden');
        this.editorView.classList.add('active');

        document.getElementById('editor-card-name').innerText = card.name;
        document.getElementById('editor-card-suit').innerText = `${card.suit} Arcana`;

        // Populate Fields
        const imgInput = document.getElementById('note-image-url');
        if(imgInput) imgInput.value = note.customImage || '';
        
        // Reset File Input so change event fires even if same file selected again later
        const fileInput = document.getElementById('note-image-file');
        if(fileInput) fileInput.value = '';

        document.getElementById('note-keywords-up').value = note.keywordsUpright || '';
        document.getElementById('note-keywords-rev').value = note.keywordsReversed || '';
        document.getElementById('note-interpretation').value = note.interpretation || '';
        document.getElementById('note-meaning').value = note.meaning || '';
        document.getElementById('note-symbolism').value = note.symbolism || '';

        // Initial Preview
        const initialImg = note.customImage || card.image;
        this.updateEditorPreview(initialImg);
    }

    updateEditorPreview(url) {
        const imgContainer = document.getElementById('editor-card-image-preview');
        if(!imgContainer) return;

        if(url && url.trim() !== '') {
            imgContainer.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;" onerror="this.parentElement.innerHTML='<i class=\\'ph ph-warning\\'></i>'">`;
        } else {
            imgContainer.innerHTML = `<i class="ph ph-sparkle" style="font-size: 2rem;"></i>`;
        }
    }

    async saveCurrentCard() {
        if (this.currentCardId === null) return;

        // The URL input acts as the container for both text URLs and Base64 strings
        const noteData = {
            customImage: document.getElementById('note-image-url').value,
            keywordsUpright: document.getElementById('note-keywords-up').value,
            keywordsReversed: document.getElementById('note-keywords-rev').value,
            interpretation: document.getElementById('note-interpretation').value,
            meaning: document.getElementById('note-meaning').value,
            symbolism: document.getElementById('note-symbolism').value
        };

        await this.api.saveCardNote(this.currentCardId, noteData);
        alert("Notes saved successfully!");
        this.closeEditor();
    }

    closeEditor() {
        this.editorView.classList.add('hidden');
        this.editorView.classList.remove('active');
        document.getElementById('view-deck').classList.add('active');
        this.renderLibrary(); 
    }
}