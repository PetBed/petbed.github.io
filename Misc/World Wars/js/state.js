export const State = {
    atlas: [],
    currentUser: localStorage.getItem('archive_user_id'),
    theme: localStorage.getItem('archive_theme') || 'light', // Default to light
    
    setAtlas(data) { 
        this.atlas = data; 
    },
    
    setCurrentUser(id) { 
        this.currentUser = id; 
        if(id) localStorage.setItem('archive_user_id', id);
        else localStorage.removeItem('archive_user_id');
    },

    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('archive_theme', theme);
        // Apply to body immediately
        document.body.setAttribute('data-theme', theme);
    }
};