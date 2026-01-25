export default class SpreadBuilder {
    constructor(containerId, api) {
        this.viewport = document.getElementById(containerId);
        this.api = api;
        this.slots = []; 
        
        // Interaction State
        this.draggedEl = null;
        this.rotatingEl = null;
        this.isPanning = false;
        
        // Pan State
        this.pan = { x: 0, y: 0 };
        this.startPan = { x: 0, y: 0 };
        
        // Initialize Surface
        this.surface = document.createElement('div');
        this.surface.className = 'builder-surface';
        this.viewport.appendChild(this.surface);

        // [NEW] Initialize Scrollbars
        this.scrollX = this.createScrollbar('horizontal');
        this.scrollY = this.createScrollbar('vertical');
        this.scrollTimer = null;
        
        // Setup Resize Observer
        this.setupResponsiveSurface();
        window.addEventListener('resize', () => this.setupResponsiveSurface());

        this.currentSpreadId = null;
        this.setupEvents();
    }

    // [NEW] Helper to create scrollbar elements
    createScrollbar(type) {
        const bar = document.createElement('div');
        bar.className = `builder-scrollbar ${type}`;
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        bar.appendChild(thumb);
        this.viewport.appendChild(bar);
        return { bar, thumb };
    }

    setupResponsiveSurface() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            this.surface.style.width = '1000px'; 
            this.surface.style.height = '700px'; 
        } else {
            this.surface.style.width = '100%';
            this.surface.style.height = '100%';
            this.pan = { x: 0, y: 0 };
        }
        this.updateSurfaceTransform();
    }

    reset() {
        this.currentSpreadId = null;
        this.slots = [];
        this.surface.innerHTML = ''; 
        this.pan = { x: 0, y: 0 };
        this.updateSurfaceTransform();
        
        const nameInput = document.getElementById('builder-name');
        if(nameInput) nameInput.value = '';
    }

    loadSpread(spread) {
        this.reset();
        this.currentSpreadId = spread._id;
        const nameInput = document.getElementById('builder-name');
        if(nameInput) nameInput.value = spread.name;
        
        spread.positions.forEach(pos => {
            this.slots.push(pos);
            this.renderSlot(pos);
        });
    }

    addSlot() {
        const maxId = this.slots.reduce((max, s) => Math.max(max, s.id), 0);
        const id = maxId + 1;
        const slotData = { id, name: `Card ${id}`, x: 50, y: 50, rotation: 0 };
        this.slots.push(slotData);
        this.renderSlot(slotData);
    }

    renderSlot(data) {
        const el = document.createElement('div');
        el.className = 'card-slot';
        el.dataset.id = data.id;
        el.innerHTML = `<span>${data.name || 'Card ' + data.id}</span><div class="rotate-handle"></div>`;
        
        el.style.left = `${data.x}%`;
        el.style.top = `${data.y}%`;
        el.style.transform = `translate(-50%, -50%) rotate(${data.rotation}deg)`;
        
        this.surface.appendChild(el); 
    }

    setupEvents() {
        const handleStart = (e) => {
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            let target = e.target;
            if (e.type === 'touchstart') {
                 target = document.elementFromPoint(clientX, clientY);
            }

            // 1. ROTATE
            if (target && target.classList.contains('rotate-handle')) {
                e.preventDefault(); 
                this.rotatingEl = target.parentElement;
                this.draggedEl = null;
                this.isPanning = false;
            } 
            // 2. DRAG CARD
            else if (target && target.closest('.card-slot')) {
                e.preventDefault();
                this.draggedEl = target.closest('.card-slot');
                this.rotatingEl = null;
                this.isPanning = false;
            } 
            // 3. PAN SURFACE
            else {
                if (this.viewport.contains(target)) {
                    if(e.cancelable && e.type !== 'mousedown') e.preventDefault();
                    
                    this.isPanning = true;
                    this.draggedEl = null;
                    this.rotatingEl = null;
                    this.startPan = { 
                        x: clientX - this.pan.x, 
                        y: clientY - this.pan.y 
                    };
                }
            }
        };

        const handleMove = (e) => {
            if (!this.draggedEl && !this.rotatingEl && !this.isPanning) return;
            if(e.cancelable) e.preventDefault(); 

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            if (this.draggedEl) {
                const rect = this.surface.getBoundingClientRect();
                const mouseX = clientX - rect.left;
                const mouseY = clientY - rect.top;
                
                let xPct = (mouseX / rect.width) * 100;
                let yPct = (mouseY / rect.height) * 100;

                xPct = Math.max(0, Math.min(100, xPct));
                yPct = Math.max(0, Math.min(100, yPct));

                this.draggedEl.style.left = `${xPct}%`;
                this.draggedEl.style.top = `${yPct}%`;
            } 
            else if (this.rotatingEl) {
                const elRect = this.rotatingEl.getBoundingClientRect();
                const centerX = elRect.left + elRect.width / 2;
                const centerY = elRect.top + elRect.height / 2;
                
                const deltaX = clientX - centerX;
                const deltaY = clientY - centerY;
                const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;

                this.rotatingEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
                this.rotatingEl.dataset.rotation = angle;
            }
            else if (this.isPanning) {
                let newX = clientX - this.startPan.x;
                let newY = clientY - this.startPan.y;

                const viewportW = this.viewport.clientWidth;
                const viewportH = this.viewport.clientHeight;
                const surfaceW = this.surface.clientWidth;
                const surfaceH = this.surface.clientHeight;

                const minX = Math.min(0, viewportW - surfaceW);
                const minY = Math.min(0, viewportH - surfaceH);

                newX = Math.max(minX, Math.min(0, newX));
                newY = Math.max(minY, Math.min(0, newY));

                this.pan = { x: newX, y: newY };
                this.updateSurfaceTransform();
            }
        };

        const handleEnd = () => {
            if (this.draggedEl) {
                this.updateSlotData(this.draggedEl);
                this.draggedEl = null;
            }
            if (this.rotatingEl) {
                this.updateSlotData(this.rotatingEl);
                this.rotatingEl = null;
            }
            this.isPanning = false;
        };

        const opts = { passive: false };
        this.viewport.addEventListener('mousedown', handleStart);
        this.viewport.addEventListener('touchstart', handleStart, opts);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, opts);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
    }

    // [UPDATED] Update transform AND scrollbars
    updateSurfaceTransform() {
        this.surface.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px)`;
        this.updateScrollbars();
        
        // Show scrollbars temporarily
        this.viewport.classList.add('scrolling');
        clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
            this.viewport.classList.remove('scrolling');
        }, 1500);
    }

    // [NEW] Calculate and render scrollbar thumbs
    updateScrollbars() {
        const vw = this.viewport.clientWidth;
        const vh = this.viewport.clientHeight;
        const sw = this.surface.clientWidth;
        const sh = this.surface.clientHeight;

        // Horizontal
        if (sw > vw) {
            this.scrollX.bar.style.display = 'block';
            const thumbW = (vw / sw) * vw; // Proportional size
            this.scrollX.thumb.style.width = `${thumbW}px`;
            
            const maxPanX = vw - sw; // Negative number
            const progress = this.pan.x / maxPanX; // 0 to 1
            const trackSpace = vw - thumbW;
            const thumbPos = progress * trackSpace;
            
            this.scrollX.thumb.style.transform = `translateX(${thumbPos}px)`;
        } else {
            this.scrollX.bar.style.display = 'none';
        }

        // Vertical
        if (sh > vh) {
            this.scrollY.bar.style.display = 'block';
            const thumbH = (vh / sh) * vh; 
            this.scrollY.thumb.style.height = `${thumbH}px`;
            
            const maxPanY = vh - sh;
            const progress = this.pan.y / maxPanY;
            const trackSpace = vh - thumbH;
            const thumbPos = progress * trackSpace;
            
            this.scrollY.thumb.style.transform = `translateY(${thumbPos}px)`;
        } else {
            this.scrollY.bar.style.display = 'none';
        }
    }

    updateSlotData(el) {
        const id = parseInt(el.dataset.id);
        const slot = this.slots.find(s => s.id === id);
        if (!slot) return;
        
        slot.x = parseFloat(el.style.left);
        slot.y = parseFloat(el.style.top);
        
        const match = el.style.transform.match(/rotate\(([-0-9.]+)deg\)/);
        if (match) slot.rotation = parseFloat(match[1]);
        else if (el.dataset.rotation) slot.rotation = parseFloat(el.dataset.rotation);
    }

    async save() {
        const nameInput = document.getElementById('builder-name');
        const name = nameInput ? nameInput.value : '';
        if (!name) return alert("Please name your spread.");

        const spreadData = {
            name: name,
            positions: this.slots
        };

        try {
            if (this.currentSpreadId) {
                await this.api.updateSpread(this.currentSpreadId, spreadData);
                alert("Spread Updated!");
            } else {
                const saved = await this.api.saveSpread(spreadData);
                this.currentSpreadId = saved._id; 
                alert("Spread Created!");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving spread.");
        }
    }
}