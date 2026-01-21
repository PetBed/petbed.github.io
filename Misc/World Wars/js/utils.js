import { State } from './state.js';

// 1. MARKDOWN PARSER
export function parseContent(text) {
    if (!text) return '';

    let preProcessed = text.replace(/:::\s*summary\s*([\s\S]*?)\s*:::/gi, (match, content) => {
        return `<section class="summary-box"><h3>Summary</h3><p>${content.trim()}</p></section>`;
    });

    preProcessed = preProcessed.replace(/\[\[(.*?)\]\]/g, (match, content) => {
        const pipeIndex = content.indexOf('|');
        let targetTitle = content;
        let displayText = content;

        if (pipeIndex !== -1) {
            targetTitle = content.substring(0, pipeIndex);
            displayText = content.substring(pipeIndex + 1);
        }
        
        targetTitle = targetTitle.trim();
        displayText = displayText.trim();
        if (!displayText) displayText = targetTitle;

        const found = State.atlas.find(item => item.title.toLowerCase() === targetTitle.toLowerCase());
        
        if (found) {
            return `<a href="#/entity/${found.slug}" class="wiki-link valid" style="color: var(--era-ww1); font-weight: 600; text-decoration: none;">${displayText}</a>`;
        } else {
            return `<span class="wiki-link missing" title="Page not created yet" style="color: #adb5bd; cursor: help; border-bottom: 1px dashed #adb5bd;">${displayText}</span>`;
        }
    });

    try {
        return marked.parse(preProcessed);
    } catch (e) {
        console.error("Markdown parsing failed:", e);
        return `<p>${preProcessed}</p>`;
    }
}

// 2. DELETE MODAL
export function showDeleteModal(title, onConfirm) {
    const modal = document.createElement('div');
    Object.assign(modal.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: '1000'
    });
    
    modal.innerHTML = `
        <div style="background:var(--card-bg); color:var(--text-main); padding:2rem; border-radius:8px; max-width:400px; text-align:center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid var(--border-color);">
            <h3 style="margin-top:0;">Delete Entry?</h3>
            <p>Are you sure you want to delete <strong>${title}</strong>? This action cannot be undone.</p>
            <div style="margin-top:1.5rem; display:flex; gap:1rem; justify-content:center;">
                <button id="modal-cancel" style="padding:0.5rem 1rem; border:1px solid var(--border-color); background:var(--input-bg); color:var(--text-main); border-radius:4px; cursor:pointer;">Cancel</button>
                <button id="modal-confirm" style="padding:0.5rem 1rem; border:none; background:#dc3545; color:white; border-radius:4px; cursor:pointer; font-weight:bold;">Delete Forever</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('#modal-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#modal-confirm').addEventListener('click', () => { onConfirm(); modal.remove(); });
}

// 3. AUTOCOMPLETE
export function setupWikiLinkAutocomplete(textarea) {
    if (!textarea) return;

    if (!document.getElementById('wiki-ac-style')) {
        const style = document.createElement('style');
        style.id = 'wiki-ac-style';
        style.innerHTML = `
            .wiki-autocomplete { position: absolute; background: white; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 200px; overflow-y: auto; width: 300px; z-index: 10000; font-family: var(--font-ui); display: none; }
            .wiki-suggestion { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f8f9fa; display: flex; justify-content: space-between; align-items: center; }
            .wiki-suggestion:last-child { border-bottom: none; }
            .wiki-suggestion:hover, .wiki-suggestion.active { background: #f1f3f5; color: var(--era-ww1); }
            .wiki-suggestion .type { font-size: 0.7em; text-transform: uppercase; color: #adb5bd; font-weight: bold; }
        `;
        document.head.appendChild(style);
    }

    let dropdown = document.querySelector('.wiki-autocomplete');
    if(!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'wiki-autocomplete';
        document.body.appendChild(dropdown);
    }

    let activeIndex = 0;
    let suggestions = [];
    let matchStart = -1;

    const fuzzyMatch = (query, target) => {
        query = query.toLowerCase(); target = target.toLowerCase();
        let qIdx = 0;
        for (let tIdx = 0; tIdx < target.length; tIdx++) {
            if (target[tIdx] === query[qIdx]) {
                qIdx++;
                if (qIdx === query.length) return true;
            }
        }
        return false;
    };

    const getCaretCoordinates = () => {
        const div = document.createElement('div');
        const style = window.getComputedStyle(textarea);
        Array.from(style).forEach(prop => div.style[prop] = style.getPropertyValue(prop));
        div.style.position = 'absolute'; div.style.visibility = 'hidden'; div.style.whiteSpace = 'pre-wrap'; div.style.top = 0; div.style.left = 0;
        
        const text = textarea.value.substring(0, textarea.selectionStart);
        const span = document.createElement('span'); span.textContent = text; div.appendChild(span);
        const cursorMarker = document.createElement('span'); cursorMarker.textContent = '|'; div.appendChild(cursorMarker);

        document.body.appendChild(div);
        const rect = textarea.getBoundingClientRect();
        const coords = {
            top: rect.top + cursorMarker.offsetTop - textarea.scrollTop + window.scrollY,
            left: rect.left + cursorMarker.offsetLeft - textarea.scrollLeft + window.scrollX,
            height: parseInt(style.lineHeight)
        };
        document.body.removeChild(div);
        return coords;
    };

    const closeDropdown = () => { dropdown.style.display = 'none'; matchStart = -1; };

    const insertLink = (title) => {
        const text = textarea.value;
        const before = text.substring(0, matchStart);
        let after = text.substring(textarea.selectionStart);
        
        // FIX: Check if closing brackets already exist
        if (after.startsWith(']]')) {
            after = after.substring(2);
        }
        
        const insertion = `[[${title}]]`;
        textarea.value = before + insertion + after;
        const newPos = before.length + insertion.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
        closeDropdown();
    };

    textarea.addEventListener('input', () => {
        const cursor = textarea.selectionStart;
        const text = textarea.value;
        const lookback = text.substring(0, cursor);
        const openBracket = lookback.lastIndexOf('[[');
        
        if (openBracket !== -1) {
            const closeBracket = lookback.lastIndexOf(']]');
            if (closeBracket > openBracket) { closeDropdown(); return; }

            const query = lookback.substring(openBracket + 2);
            if (query.includes('\n')) { closeDropdown(); return; }

            matchStart = openBracket;
            suggestions = State.atlas.filter(item => fuzzyMatch(query, item.title)).slice(0, 10);
            
            if (suggestions.length > 0) {
                dropdown.innerHTML = suggestions.map((s, i) => `
                    <div class="wiki-suggestion ${i === 0 ? 'active' : ''}" data-index="${i}">
                        <span>${s.title}</span><span class="type">${s.type}</span>
                    </div>
                `).join('');
                const coords = getCaretCoordinates();
                dropdown.style.top = (coords.top + coords.height) + 'px';
                dropdown.style.left = coords.left + 'px';
                dropdown.style.display = 'block';
                activeIndex = 0;
                
                dropdown.querySelectorAll('.wiki-suggestion').forEach(el => {
                    el.addEventListener('mousedown', (e) => { e.preventDefault(); insertLink(suggestions[el.dataset.index].title); });
                });
            } else { closeDropdown(); }
        } else { closeDropdown(); }
    });

    textarea.addEventListener('keydown', (e) => {
        if (dropdown.style.display === 'block') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % suggestions.length;
                updateActive();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
                updateActive();
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertLink(suggestions[activeIndex].title);
            } else if (e.key === 'Escape') {
                closeDropdown();
            }
        }
    });

    const updateActive = () => {
        dropdown.querySelectorAll('.wiki-suggestion').forEach((el, i) => {
            el.classList.toggle('active', i === activeIndex);
            if (i === activeIndex) el.scrollIntoView({ block: 'nearest' });
        });
    };

    textarea.addEventListener('blur', () => setTimeout(closeDropdown, 200));
}

// 4. TAG INPUT
export function setupTagInput(wrapper, name, initialValues = []) {
    // FIX: Using CSS variables for wrapper styles
    wrapper.style.position = 'relative';
    wrapper.innerHTML = `
        <div class="tag-container" style="display: flex; flex-wrap: wrap; gap: 4px; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); min-height: 38px;">
            <!-- Tags injected here -->
            <input type="text" class="tag-input" placeholder="Add link..." style="border: none; outline: none; flex-grow: 1; padding: 4px; min-width: 80px; font-size: 0.9rem; font-family: var(--font-ui); background: transparent; color: var(--text-main);">
        </div>
        <input type="hidden" name="${name}" value="${initialValues.join(', ')}">
        <div class="tag-dropdown" style="display:none; position: absolute; top: 100%; left: 0; right: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 4px; box-shadow: 0 4px 12px var(--shadow-color); max-height: 200px; overflow-y: auto; z-index: 1000; margin-top: 2px;"></div>
    `;

    const tagContainer = wrapper.querySelector('.tag-container');
    const input = wrapper.querySelector('.tag-input');
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');
    const dropdown = wrapper.querySelector('.tag-dropdown');

    let tags = [...initialValues];
    let activeIndex = 0;
    let suggestions = [];

    const updateTags = () => {
        Array.from(tagContainer.children).forEach(child => {
            if (!child.classList.contains('tag-input')) child.remove();
        });

        tags.forEach((tag, index) => {
            const tagEl = document.createElement('div');
            // FIX: Using CSS variables for tag chips
            tagEl.style.cssText = "background: var(--hover-bg); border: 1px solid var(--border-color); border-radius: 3px; padding: 2px 8px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; color: var(--text-main); font-weight: 500;";
            tagEl.innerHTML = `
                <span>${tag}</span>
                <span class="remove-tag" data-index="${index}" style="cursor: pointer; color: var(--text-muted); font-weight: bold; line-height: 1;">&times;</span>
            `;
            
            tagEl.querySelector('.remove-tag').onclick = (e) => {
                e.stopPropagation();
                removeTag(index);
            };
            
            tagContainer.insertBefore(tagEl, input);
        });

        hiddenInput.value = tags.join(', ');
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const addTag = (title) => {
        const cleanTitle = title.trim();
        if (cleanTitle && !tags.includes(cleanTitle)) {
            tags.push(cleanTitle);
            updateTags();
        }
        input.value = '';
        closeDropdown();
        input.focus();
    };

    const removeTag = (index) => {
        tags.splice(index, 1);
        updateTags();
    };

    const fuzzyMatch = (query, target) => {
        query = query.toLowerCase(); target = target.toLowerCase();
        let qIdx = 0;
        for (let tIdx = 0; tIdx < target.length; tIdx++) {
            if (target[tIdx] === query[qIdx]) {
                qIdx++;
                if (qIdx === query.length) return true;
            }
        }
        return false;
    };

    const openDropdown = (query) => {
        suggestions = State.atlas.filter(item => 
            fuzzyMatch(query, item.title) && !tags.includes(item.title)
        ).slice(0, 10);

        if (suggestions.length === 0) {
            closeDropdown();
            return;
        }

        dropdown.innerHTML = suggestions.map((s, i) => `
            <div class="wiki-suggestion ${i === 0 ? 'active' : ''}" data-index="${i}">
                <span>${s.title}</span><span class="type" style="font-size:0.7em; text-transform:uppercase; color:var(--text-muted); font-weight:bold;">${s.type}</span>
            </div>
        `).join('');

        dropdown.style.display = 'block';
        activeIndex = 0;

        dropdown.querySelectorAll('.wiki-suggestion').forEach(el => {
            el.onmousedown = (e) => { 
                e.preventDefault();
                addTag(suggestions[el.dataset.index].title);
            };
        });
    };

    const closeDropdown = () => {
        dropdown.style.display = 'none';
        activeIndex = -1;
    };

    const updateActive = () => {
        dropdown.querySelectorAll('.wiki-suggestion').forEach((el, i) => {
            el.classList.toggle('active', i === activeIndex);
            if (i === activeIndex) el.scrollIntoView({ block: 'nearest' });
        });
    };

    tagContainer.addEventListener('click', () => input.focus());

    input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val) openDropdown(val);
        else closeDropdown();
    });

    input.addEventListener('keydown', (e) => {
        if (dropdown.style.display === 'block') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % suggestions.length;
                updateActive();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
                updateActive();
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (activeIndex >= 0 && suggestions[activeIndex]) {
                    addTag(suggestions[activeIndex].title);
                } else if (input.value) {
                    addTag(input.value); 
                }
            } else if (e.key === 'Escape') {
                closeDropdown();
            }
        } else if (e.key === 'Enter' && input.value) {
            e.preventDefault();
            addTag(input.value);
        } else if (e.key === 'Backspace' && !input.value && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    });

    input.addEventListener('blur', () => setTimeout(closeDropdown, 200));

    updateTags();
}