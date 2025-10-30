// Import the global config
import config from './config.js';

/**
 * EtymologyLog Module
 * Handles all frontend logic for the Etymology Word Log.
 */
const EtymologyLog = (() => {
    // DOM Elements
    let addWordBtn, wordFormModal, wordForm, wordListContainer,
        closeModalBtn, formTitle, wordIdField, definitionsContainer,
        relatedWordsContainer, addDefinitionBtn, addRelatedWordBtn;

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
        definitionsContainer = document.getElementById('definitions-container');
        relatedWordsContainer = document.getElementById('related-words-container');
        addDefinitionBtn = document.getElementById('add-definition-btn');
        addRelatedWordBtn = document.getElementById('add-related-word-btn');
    };

    // --- Dynamic Input List Functions ---

    /**
     * Creates a new input field for multi-value fields (definitions, related words).
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
     * Adds a new dynamic input to a container.
     * @param {HTMLElement} container - The container element.
     * @param {string} placeholder - The placeholder text for the new input.
     */
    const addDynamicInput = (container, placeholder) => {
        container.appendChild(createDynamicInput('', placeholder));
    };

    /**
     * Gets all values from a dynamic input container.
     * @param {HTMLElement} container - The container element.
     * @returns {string[]} An array of the input values.
     */
    const getDynamicInputValues = (container) => {
        return Array.from(container.querySelectorAll('.dynamic-input-group input'))
            .map(input => input.value.trim())
            .filter(value => value.length > 0);
    };

    /**
     * Sets values for a dynamic input container, clearing old ones.
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
        
        if (word) {
            // Populate form for editing
            wordIdField.value = word._id;
            document.getElementById('word').value = word.word || '';
            document.getElementById('pronunciation').value = word.pronunciation || '';
            document.getElementById('partOfSpeech').value = word.partOfSpeech || '';
            document.getElementById('personalNotes').value = word.personalNotes || '';

            // Etymology sub-fields
            document.getElementById('origin').value = word.etymology?.origin || '';
            document.getElementById('morphology').value = word.etymology?.morphology || '';
            document.getElementById('protoRoot').value = word.etymology?.protoRoot || '';
            document.getElementById('semanticShift').value = word.etymology?.semanticShift || '';
            document.getElementById('etymologyNotes').value = word.etymology?.notes || '';
            
            // Dynamic fields
            setDynamicInputValues(definitionsContainer, word.definitions, 'e.g., "A state of happy chance."');
            setDynamicInputValues(relatedWordsContainer, word.relatedWords, 'e.g., "serene"');

        } else {
            // Clear form for adding
            setDynamicInputValues(definitionsContainer, [], 'e.g., "A state of happy chance."');
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
        
        const formData = {
            userId: currentUserId,
            word: document.getElementById('word').value,
            pronunciation: document.getElementById('pronunciation').value,
            partOfSpeech: document.getElementById('partOfSpeech').value,
            personalNotes: document.getElementById('personalNotes').value,
            
            definitions: getDynamicInputValues(definitionsContainer),
            relatedWords: getDynamicInputValues(relatedWordsContainer),
            
            etymology: {
                origin: document.getElementById('origin').value,
                morphology: document.getElementById('morphology').value,
                protoRoot: document.getElementById('protoRoot').value,
                semanticShift: document.getElementById('semanticShift').value,
                notes: document.getElementById('etymologyNotes').value
            }
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
            wordCard.innerHTML = `
                <div class="word-card-header">
                    <h3 class="word-card-title">${word.word}</h3>
                    <span class="word-card-pos">${word.partOfSpeech || ''}</span>
                    <span class="word-card-ipa">${word.pronunciation || ''}</span>
                </div>
                <div class="word-card-body">
                    <p><strong>Definition:</strong> ${word.definitions?.[0] || 'No definition added.'}</p>
                    <p><strong>Origin:</strong> ${word.etymology?.origin || 'No origin added.'}</p>
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
        
        // Add listeners for "add dynamic input" buttons
        if (addDefinitionBtn) {
            addDefinitionBtn.addEventListener('click', () => {
                addDynamicInput(definitionsContainer, 'e.g., "A state of happy chance."');
            });
        }
        if (addRelatedWordBtn) {
            addRelatedWordBtn.addEventListener('click', () => {
                addDynamicInput(relatedWordsContainer, 'e.g., "serene"');
            });
        }

        // Load initial words
        loadWords();
    };
    
    return { init, loadWords };
})();

// Export the module for use in index.html
export default EtymologyLog;
