// Import the global config
import config from './config.js';

/**
 * EtymologyLog Module
 * Handles all frontend logic for the Etymology Word Log.
 */
const EtymologyLog = (() => {

    // --- Constants ---
    const POS_OPTIONS = [
        'noun', 'verb', 'adjective', 'adverb', 'pronoun', 
        'preposition', 'conjunction', 'interjection', 'other'
    ];
    
    const ETYMOLOGY_OPTIONS = [
        'Origin', 'Morphology', 'Proto-Root', 'Semantic Shift', 'Notes'
    ];

    // --- DOM Elements ---
    let addWordBtn, wordFormModal, wordForm, wordListContainer,
        closeModalBtn, formTitle, wordIdField,
        definitionsContainer, addPosGroupBtn,
        etymologyFieldsContainer, addEtymologyFieldBtn,
        relatedWordsContainer, addRelatedWordBtn;

    // State
    let currentUserId = null;

    // Cache DOM elements
    const cacheDOM = () => {
        addWordBtn = document.getElementById('add-word-btn');
        wordFormModal = document.getElementById('word-form-modal');
        wordForm = document.getElementById('word-form');
        wordListContainer = document.getElementById('word-list-container');
        closeModalBtn = document.getElementById('close-modal-btn');
        formTitle = document.getElementById('word-form-title');
        wordIdField = document.getElementById('word-id');
        
        // Definition elements
        definitionsContainer = document.getElementById('definitions-container');
        addPosGroupBtn = document.getElementById('add-pos-group-btn');

        // Etymology elements
        etymologyFieldsContainer = document.getElementById('etymology-fields-container');
        addEtymologyFieldBtn = document.getElementById('add-etymology-field-btn');
        
        // Related words elements
        relatedWordsContainer = document.getElementById('related-words-container');
        addRelatedWordBtn = document.getElementById('add-related-word-btn');
    };

    // --- Dynamic Form Creation ---

    /**
     * Creates a simple dynamic input field (for definitions, related words).
     * @param {string} value - The pre-filled value for the input.
     * @param {string} placeholder - The placeholder text for the input.
     * @returns {HTMLElement} The created input group element.
     */
    const createDynamicInput = (value = '', placeholder) => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'dynamic-input-group';
        inputGroup.innerHTML = `
            <input type="text" class="form-input" value="${value}" placeholder="${placeholder}" />
            <button type="button" class="btn-remove-dynamic" aria-label="Remove field">×</button>
        `;
        inputGroup.querySelector('.btn-remove-dynamic').addEventListener('click', () => {
            inputGroup.remove();
        });
        return inputGroup;
    };

    /**
     * Creates a new Part of Speech (POS) group in the form.
     * @param {object} data - Pre-fill data { partOfSpeech, definitions }
     */
    const createPosGroup = (data = {}) => {
        const group = document.createElement('div');
        group.className = 'pos-group';
        
        const selectedPos = data.partOfSpeech || 'noun';
        const definitions = data.definitions || [''];

        // Create <select> options
        const posOptionsHtml = POS_OPTIONS.map(opt => 
            `<option value="${opt}" ${opt === selectedPos ? 'selected' : ''}>
                ${opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>`
        ).join('');

        group.innerHTML = `
            <div class="pos-group-header">
                <select class="form-select pos-select">
                    ${posOptionsHtml}
                </select>
                <button type="button" class="btn-remove-pos-group btn-danger" aria-label="Remove Part of Speech group">Remove POS</button>
            </div>
            <div class="pos-definitions-container">
                <!-- Definition inputs will go here -->
            </div>
            <button type="button" class="btn-add-dynamic btn-add-definition" style="margin-top: 0.5rem;">+ Add Definition</button>
        `;

        // *** FIX: Use a unique variable name ***
        // Get the local container *inside* the group
        const localDefsContainer = group.querySelector('.pos-definitions-container');
        definitions.forEach(def => {
            localDefsContainer.appendChild(
                createDynamicInput(def, 'e.g., "A state of happy chance."')
            );
        });
        
        // Add event listeners
        group.querySelector('.btn-remove-pos-group').addEventListener('click', () => {
            group.remove();
        });
        
        group.querySelector('.btn-add-definition').addEventListener('click', () => {
            localDefsContainer.appendChild(
                createDynamicInput('', 'e.g., "A state of happy chance."')
            );
        });

        // *** FIX: This line now correctly refers to the module-scoped `definitionsContainer` ***
        definitionsContainer.appendChild(group);
    };
    
    /**
     * Creates a new Etymology field group in the form.
     * @param {object} data - Pre-fill data { type, value }
     */
    const createEtymologyField = (data = {}) => {
        const group = document.createElement('div');
        group.className = 'etymology-field-group';
        
        const selectedType = data.type || 'Origin';
        const value = data.value || '';
        
        // Create <select> options
        const etymologyOptionsHtml = ETYMOLOGY_OPTIONS.map(opt =>
            `<option value="${opt}" ${opt === selectedType ? 'selected' : ''}>${opt}</option>`
        ).join('');
        
        group.innerHTML = `
            <select class="form-select etymology-type-select">
                ${etymologyOptionsHtml}
            </select>
            <textarea class="form-textarea etymology-value-input" placeholder="Enter details...">${value}</textarea>
            <button type="button" class="btn-remove-dynamic btn-remove-etymology-field" aria-label="Remove field">×</button>
        `;
        
        // Add event listener
        group.querySelector('.btn-remove-etymology-field').addEventListener('click', () => {
            group.remove();
        });
        
        etymologyFieldsContainer.appendChild(group);
    };

    /**
     * Gets all values from a simple dynamic input container (like related words).
     * @param {HTMLElement} container - The container element.
     * @returns {string[]} An array of the input values.
     */
    const getDynamicInputValues = (container) => {
        return Array.from(container.querySelectorAll('.dynamic-input-group input'))
            .map(input => input.value.trim())
            .filter(value => value.length > 0);
    };

    /**
     * Sets values for a simple dynamic input container.
     * @param {HTMLElement} container - The container element.
     * @param {string[]} values - The array of values to set.
     * @param {string} placeholder - The placeholder text for the inputs.
     */
    const setDynamicInputValues = (container, values, placeholder) => {
        container.innerHTML = ''; // Clear existing
        if (values && values.length > 0) {
            values.forEach(value => {
                container.appendChild(createDynamicInput(value, placeholder));
            });
        } else {
            // Add one empty input if no values exist
            container.appendChild(createDynamicInput('', placeholder));
        }
    };
    
    // --- Modal & Form Functions ---

    /**
     * Opens the Add/Edit Word modal.
     * @param {string} title - The title for the modal (e.g., "Add Word").
     * @param {object | null} word - The word object to pre-fill for editing, or null for adding.
     */
    const openModal = (title, word = null) => {
        formTitle.textContent = title;
        wordForm.reset();
        wordIdField.value = '';
        
        // Clear dynamic containers
        definitionsContainer.innerHTML = '';
        etymologyFieldsContainer.innerHTML = '';
        
        if (word) {
            // === Populate form for editing ===
            wordIdField.value = word._id;
            document.getElementById('word').value = word.word || '';
            document.getElementById('pronunciation').value = word.pronunciation || '';
            document.getElementById('personalNotes').value = word.personalNotes || '';

            // Populate definitions
            if (word.definitions && word.definitions.length > 0) {
                word.definitions.forEach(defGroup => createPosGroup(defGroup));
            } else {
                createPosGroup(); // Add one empty group
            }
            
            // Populate etymology
            if (word.etymology && word.etymology.length > 0) {
                word.etymology.forEach(etymGroup => createEtymologyField(etymGroup));
            }
            
            // Populate related words
            setDynamicInputValues(relatedWordsContainer, word.relatedWords, 'e.g., "serene"');

        } else {
            // === Clear form for adding ===
            createPosGroup(); // Add one empty POS group
            setDynamicInputValues(relatedWordsContainer, [], 'e.g., "serene"');
        }
        
        wordFormModal.classList.remove('hidden');
    };

    /** Closes the Add/Edit Word modal. */
    const closeModal = () => {
        wordFormModal.classList.add('hidden');
    };

    /** Handles the submission of the Add/Edit Word form. */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const wordId = wordIdField.value;
        const submitButton = wordForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        
        // --- Gather Dynamic Data ---
        
        // 1. Gather Definitions
        const definitionsData = [];
        const posGroups = definitionsContainer.querySelectorAll('.pos-group');
        posGroups.forEach(group => {
            const partOfSpeech = group.querySelector('.pos-select').value;
            const definitionInputs = group.querySelectorAll('.pos-definitions-container .dynamic-input-group input');
            const definitions = Array.from(definitionInputs)
                .map(input => input.value.trim())
                .filter(val => val.length > 0);
            
            if (definitions.length > 0) {
                definitionsData.push({ partOfSpeech, definitions });
            }
        });
        
        // 2. Gather Etymology
        const etymologyData = [];
        const etymologyGroups = etymologyFieldsContainer.querySelectorAll('.etymology-field-group');
        etymologyGroups.forEach(group => {
            const type = group.querySelector('.etymology-type-select').value;
            const value = group.querySelector('.etymology-value-input').value.trim();
            
            if (value.length > 0) {
                etymologyData.push({ type, value });
            }
        });
        
        // 3. Gather Related Words
        const relatedWordsData = getDynamicInputValues(relatedWordsContainer);
        
        // --- Construct Final Form Data ---
        const formData = {
            userId: currentUserId,
            word: document.getElementById('word').value,
            pronunciation: document.getElementById('pronunciation').value,
            personalNotes: document.getElementById('personalNotes').value,
            definitions: definitionsData,
            etymology: etymologyData,
            relatedWords: relatedWordsData
        };

        try {
            let response;
            if (wordId) {
                // Update existing word
                response = await fetch(`${config.API_BASE_URL}/etymology-log/${wordId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new word
                response = await fetch(`${config.API_BASE_URL}/etymology-log`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to save word.');
            }
            
            closeModal();
            loadWords(); // Refresh the list
            
        } catch (err) {
            // Simple error handling
            alert(`Error: ${err.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Word';
        }
    };

    // --- Data Fetching & Rendering ---

    /** Fetches all word entries for the current user from the API. */
    const loadWords = async () => {
        if (!currentUserId) return;
        
        wordListContainer.innerHTML = `<p class="loading-message">Loading your word log...</p>`;
        
        try {
            const response = await fetch(`${config.API_BASE_URL}/etymology-log?userId=${currentUserId}`);
            if (!response.ok) throw new Error('Failed to fetch words.');
            
            const words = await response.json();
            renderWordList(words);
            
        } catch (err) {
            console.error(err);
            wordListContainer.innerHTML = `<p class="error-message">Could not load your word log. Please try again later.</p>`;
        }
    };
    
    /**
     * Renders the list of word entries into the DOM.
     * @param {object[]} words - An array of word objects from the API.
     */
    const renderWordList = (words) => {
        wordListContainer.innerHTML = ''; // Clear list
        
        if (words.length === 0) {
            wordListContainer.innerHTML = `<p class="empty-list-message">Your word log is empty. Click "Add New Word" to get started!</p>`;
            return;
        }
        
        words.forEach(word => {
            const wordCard = document.createElement('div');
            wordCard.className = 'word-card';
            
            // Get first definition group for display
            const firstDefGroup = word.definitions?.[0];
            const partOfSpeech = firstDefGroup?.partOfSpeech || '';
            const firstDefinition = firstDefGroup?.definitions?.[0] || 'No definition added.';
            
            // Get first 'Origin' field for display
            const origin = word.etymology?.find(e => e.type === 'Origin')?.value || 'No origin added.';
            
            wordCard.innerHTML = `
                <div class="word-card-header">
                    <h3 class="word-card-title">${word.word}</h3>
                    <span class="word-card-pos">${partOfSpeech}</span>
                    <span class="word-card-ipa">${word.pronunciation || ''}</span>
                </div>
                <div class="word-card-body">
                    <p><strong>Definition:</strong> ${firstDefinition}</p>
                    <p><strong>Origin:</strong> ${origin}</p>
                    <p class="word-card-notes"><strong>Notes:</strong> ${word.personalNotes || '...'}</p>
                </div>
                <div class="word-card-actions">
                    <button class="btn btn-secondary btn-edit">Edit</button>
                    <button class="btn btn-danger btn-delete">Delete</button>
                </div>
            `;
            
            // Add event listeners
            wordCard.querySelector('.btn-edit').addEventListener('click', () => {
                openModal('Edit Word Entry', word);
            });
            wordCard.querySelector('.btn-delete').addEventListener('click', () => {
                deleteWord(word._id);
            });
            
            wordListContainer.appendChild(wordCard);
        });
    };
    
    /**
     * Deletes a word entry by its ID.
     * @param {string} wordId - The ID of the word to delete.
     */
    const deleteWord = async (wordId) => {
        // A simple confirmation. A custom modal would be better in a real app.
        if (!confirm('Are you sure you want to delete this word entry? This cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`${config.API_BASE_URL}/etymology-log/${wordId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete word.');
            }
            
            loadWords(); // Refresh list
            
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // --- Init ---
    
    /** Initializes the EtymologyLog module. */
    const init = () => {
        currentUserId = sessionStorage.getItem('userId');
        if (!currentUserId) {
            console.error('No user ID found, etymology log disabled.');
            return;
        }
        
        cacheDOM();
        
        // Add event listeners
        if (addWordBtn) {
            addWordBtn.addEventListener('click', () => openModal('Add New Word Entry'));
        }
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        if (wordForm) {
            wordForm.addEventListener('submit', handleSubmit);
        }
        
        // Add listeners for new dynamic group buttons
        if (addPosGroupBtn) {
            addPosGroupBtn.addEventListener('click', () => createPosGroup());
        }
        if (addEtymologyFieldBtn) {
            addEtymologyFieldBtn.addEventListener('click', () => createEtymologyField());
        }
        if (addRelatedWordBtn) {
            addRelatedWordBtn.addEventListener('click', () => {
                relatedWordsContainer.appendChild(
                    createDynamicInput('', 'e.g., "serene"')
                );
            });
        }

        // Load initial words
        loadWords();
    };
    
    return { init, loadWords };
})();

// Export the module for use in index.html
export default EtymologyLog;

