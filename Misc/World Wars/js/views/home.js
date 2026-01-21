import { State } from '../state.js';

export function renderHome(container) {
    container.innerHTML = `
        <div class="home-header">
            <h1>History Timeline</h1>
            <p>Explore the connected events of history.</p>
            
            <div class="controls-bar">
                <div class="controls-grid">
                    <!-- Search -->
                    <div class="control-group">
                        <label>Search</label>
                        <input type="text" id="filter-search" class="control-input" placeholder="Search titles...">
                    </div>

                    <!-- Sort -->
                    <div class="control-group">
                        <label>Sort By</label>
                        <select id="sort-by" class="control-input">
                            <option value="year-asc">Year (Oldest First)</option>
                            <option value="year-desc">Year (Newest First)</option>
                            <option value="title-asc">Title (A-Z)</option>
                        </select>
                    </div>

                    <!-- Type Filter -->
                    <div class="control-group">
                        <label>Type</label>
                        <select id="filter-type" class="control-input">
                            <option value="all">All Types</option>
                            <option value="event">Events</option>
                            <option value="actor">Actors</option>
                            <option value="context">Contexts</option>
                            <option value="theme">Themes</option>
                        </select>
                    </div>

                    <!-- Era Filter -->
                    <div class="control-group">
                        <label>Era</label>
                        <select id="filter-era" class="control-input">
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
        </div>

        <div id="timeline-results" class="timeline-list"></div>
    `;

    const updateList = () => {
        const searchVal = document.getElementById('filter-search').value.toLowerCase();
        const sortVal = document.getElementById('sort-by').value;
        const typeVal = document.getElementById('filter-type').value;
        const eraVal = document.getElementById('filter-era').value;

        let filtered = State.atlas.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchVal);
            const matchesType = typeVal === 'all' || item.type === typeVal;
            const matchesEra = eraVal === 'all' || item.era === eraVal;
            return matchesSearch && matchesType && matchesEra;
        });

        filtered.sort((a, b) => {
            if (sortVal === 'year-asc') return (a.year || 9999) - (b.year || 9999);
            if (sortVal === 'year-desc') return (b.year || 9999) - (a.year || 9999);
            if (sortVal === 'title-asc') return a.title.localeCompare(b.title);
            return 0;
        });

        const resultsContainer = document.getElementById('timeline-results');
        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); margin-top: 3rem;">No entries found matching filters.</p>';
            return;
        }

        resultsContainer.innerHTML = filtered.map(item => `
            <a href="#/entity/${item.slug}" class="timeline-item" style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid var(--border-color); text-decoration: none; color: inherit; transition: background 0.2s;">
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <span class="year" style="font-weight: bold; color: var(--era-ww1); min-width: 50px; text-align:right;">${item.year || '—'}</span>
                    <div>
                        <div class="title" style="font-weight: 600; font-size: 1.1rem; color: var(--text-main);">${item.title}</div>
                        <div class="era-small" style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top:4px; font-weight: 600;">${item.era}</div>
                    </div>
                </div>
                <span class="type badge" style="font-size: 0.75rem; padding: 0.35rem 0.75rem; background: var(--hover-bg); border-radius: 6px; color: var(--text-muted); text-transform: uppercase; font-weight:700; letter-spacing: 0.5px;">${item.type}</span>
            </a>
        `).join('');
    };

    container.querySelectorAll('input, select').forEach(input => input.addEventListener('input', updateList));
    updateList();
}