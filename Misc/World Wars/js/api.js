// api.js - Handles fetching and caching
// https://wot-tau.vercel.app/
// http://192.168.1.6:3005/
const API_BASE = 'https://wot-tau.vercel.app/api/history';
const USER_API_BASE = 'https://wot-tau.vercel.app/api/study'; // Updated to new base

export const API = {
    // 1. The Atlas Strategy
    getAtlas: async () => {
        const cached = sessionStorage.getItem('history_atlas');
        if (cached) {
            return JSON.parse(cached);
        }

        console.log('Fetching fresh Atlas...');
        try {
            const res = await fetch(`${API_BASE}/atlas`);
            const data = await res.json();
            sessionStorage.setItem('history_atlas', JSON.stringify(data));
            return data;
        } catch (e) {
            console.error('Atlas fetch failed', e);
            return [];
        }
    },

    // 2. Get Single Entity (Cached)
    getEntity: async (slug) => {
        // Check Cache first
        const cacheKey = `history_entity_${slug}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            console.log(`[Cache Hit] Loading ${slug} from session storage.`);
            return JSON.parse(cached);
        }

        try {
            const res = await fetch(`${API_BASE}/entity/${slug}`);
            if (!res.ok) throw new Error('Not found');
            const data = await res.json();
            
            // Save to Cache
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    // 3. Save/Update Entity
    saveEntity: async (entityData) => {
        try {
            const res = await fetch(`${API_BASE}/entity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entityData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Save failed');
            }
            
            const savedData = await res.json();

            // Invalidate Atlas (List is stale)
            sessionStorage.removeItem('history_atlas');
            
            // Update Entity Cache (So next load is instant and correct)
            sessionStorage.setItem(`history_entity_${savedData.slug}`, JSON.stringify(savedData));
            
            return savedData;
        } catch (e) {
            throw e;
        }
    },

    // 4. User Login
    login: async (email, password) => {
        try {
            const res = await fetch(`${USER_API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Login failed');
            }
            const data = await res.json();
            return { userId: data.user.id, username: data.user.username }; 
        } catch (e) {
            throw e;
        }
    },

    // 5. Delete Entity
    deleteEntity: async (slug) => {
        try {
            const res = await fetch(`${API_BASE}/entity/${slug}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Delete failed');
            }
            
            // Invalidate Atlas
            sessionStorage.removeItem('history_atlas');
            // Remove specific entity from cache
            sessionStorage.removeItem(`history_entity_${slug}`);

            return await res.json();
        } catch (e) {
            throw e;
        }
    },

    // 6. Force Sync (New)
    sync: async () => {
        // Clear all history related cache
        sessionStorage.removeItem('history_atlas');
        
        // Clear entity caches specifically
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('history_entity_')) {
                sessionStorage.removeItem(key);
            }
        });

        // Fetch fresh Atlas
        try {
            const res = await fetch(`${API_BASE}/atlas`);
            const data = await res.json();
            sessionStorage.setItem('history_atlas', JSON.stringify(data));
            return data;
        } catch (e) {
            console.error('Sync failed', e);
            throw e;
        }
    },

    // 7. Helper
    lookupTitle: (title, atlas) => {
        const normalized = title.toLowerCase().trim();
        return atlas.find(item => item.title.toLowerCase() === normalized);
    }
};