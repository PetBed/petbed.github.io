// Configuration

const API_ROOT = 'https://wot-tau.vercel.app/api'; 
// localhost:3005

export default class TarotAPI {
    constructor() {
        this.cards = []; // Static Data
        this.spreads = []; // User Data
        this.notes = {}; // User Data: Map of cardId -> NoteObject
        this.user = null;
    }

    // --- AUTHENTICATION ---
    async init() {
        const userStr = localStorage.getItem('studyUser');
        if (userStr) this.user = JSON.parse(userStr);

        const localData = localStorage.getItem('tarot_cache');
        if (localData) {
            const parsed = JSON.parse(localData);
            this.cards = parsed.cards;
            this.spreads = parsed.spreads;
            this.notes = parsed.notes || {};
        } 
    }

    isLoggedIn() { return !!this.user; }

    async login(email, password) {
        try {
            const res = await fetch(`${API_ROOT}/study/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            this.user = data.user;
            localStorage.setItem('studyUser', JSON.stringify(this.user));
            return { success: true };
        } catch (err) { return { success: false, error: err.message }; }
    }

    async register(userData) {
        try {
            const res = await fetch(`${API_ROOT}/study/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            this.user = data.user;
            localStorage.setItem('studyUser', JSON.stringify(this.user));
            return { success: true };
        } catch (err) { return { success: false, error: err.message }; }
    }

    logout() {
        this.user = null;
        this.cards = [];
        this.spreads = [];
        this.notes = {};
        localStorage.removeItem('studyUser');
        localStorage.removeItem('tarot_cache');
    }

    // --- TAROT DATA ---
    async bootstrap() {
        if (!this.user) return;
        try {
            const res = await fetch(`${API_ROOT}/tarot/init?userId=${this.user.id}`);
            const data = await res.json();
            
            this.cards = data.cards;
            this.spreads = data.spreads;
            
            // Convert array of notes to a Map for O(1) access
            this.notes = {};
            if(data.notes) {
                data.notes.forEach(n => this.notes[n.cardId] = n);
            }
            
            this.updateCache();
        } catch (err) { console.error("Failed to bootstrap:", err); }
    }

    async saveCardNote(cardId, noteData) {
        const payload = { ...noteData, userId: this.user.id };
        const res = await fetch(`${API_ROOT}/tarot/cards/${cardId}/notes`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const savedNote = await res.json();
        this.notes[cardId] = savedNote;
        this.updateCache();
        return savedNote;
    }

    async getReadings(page = 1) {
        if (!this.user) return { readings: [] };
        const res = await fetch(`${API_ROOT}/tarot/readings?userId=${this.user.id}&page=${page}`);
        return await res.json();
    }

    async saveReading(readingData) {
        const payload = { ...readingData, userId: this.user.id };
        const res = await fetch(`${API_ROOT}/tarot/readings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    }

    async updateReading(id, readingData) {
        const res = await fetch(`${API_ROOT}/tarot/readings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(readingData)
        });
        return await res.json();
    }

    async deleteReading(id) {
        await fetch(`${API_ROOT}/tarot/readings/${id}`, { method: 'DELETE' });
    }

    async saveSpread(spreadData) {
        const payload = { ...spreadData, userId: this.user.id };
        const res = await fetch(`${API_ROOT}/tarot/spreads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const saved = await res.json();
        this.spreads.push(saved);
        this.updateCache();
        return saved;
    }

    async updateSpread(id, spreadData) {
        const res = await fetch(`${API_ROOT}/tarot/spreads/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(spreadData)
        });
        const updated = await res.json();
        const index = this.spreads.findIndex(s => s._id === id);
        if (index !== -1) this.spreads[index] = updated;
        this.updateCache();
        return updated;
    }

    // [NEW] Delete Spread
    async deleteSpread(id) {
        await fetch(`${API_ROOT}/tarot/spreads/${id}`, { method: 'DELETE' });
        // remove from local cache array
        this.spreads = this.spreads.filter(s => s._id !== id);
        this.updateCache();
    }

    async getStats() {
        if (!this.user) return null;
        const res = await fetch(`${API_ROOT}/tarot/stats?userId=${this.user.id}`);
        return await res.json();
    }

    updateCache() {
        const data = { cards: this.cards, spreads: this.spreads, notes: this.notes };
        localStorage.setItem('tarot_cache', JSON.stringify(data));
    }
}