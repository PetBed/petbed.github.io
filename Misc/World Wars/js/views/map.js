import { State } from '../state.js';

export function renderMap(container) {
    // 1. Setup Container
    container.innerHTML = `
        <div id="map-wrapper" style="width: 100%; height: calc(100vh - 60px); position: relative; background: var(--bg-color);">
            <div id="cy" style="width: 100%; height: 100%;"></div>
            
            <!-- Legend / Controls overlay -->
            <div class="map-legend" style="position: absolute; bottom: 20px; right: 20px; z-index: 10; background: var(--card-bg); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 4px 12px var(--shadow-color); font-size: 0.8rem;">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--text-main);">Graph Legend</h4>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted);">
                        <span style="width: 12px; height: 12px; border-radius: 50%; background: #ef233c;"></span> Event
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted);">
                        <span style="width: 12px; height: 12px; border-radius: 50%; background: #ffb703;"></span> Actor
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted);">
                        <span style="width: 12px; height: 12px; border-radius: 50%; background: #2b2d42;"></span> Context
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted);">
                        <span style="width: 12px; height: 12px; border-radius: 50%; background: #8d99ae;"></span> Theme
                    </div>
                </div>
                <p style="margin: 0.5rem 0 0 0; color: var(--text-muted); font-size: 0.75rem; opacity: 0.8;">
                    Scroll to zoom • Drag to pan<br>Tap node to open
                </p>
            </div>
        </div>
    `;

    // 2. Prepare Data
    const elements = [];
    
    // Add Nodes
    State.atlas.forEach(entity => {
        // Calculate size based on connections count (simple degree centrality)
        const degree = entity.connections ? entity.connections.length : 0;
        const size = Math.min(60, 20 + (degree * 3)); // Base 20, max 60

        elements.push({
            data: { 
                id: entity.slug, 
                label: entity.title,
                type: entity.type,
                era: entity.era,
                size: size,
                degree: degree
            }
        });
    });

    // Add Edges
    State.atlas.forEach(entity => {
        if (entity.connections) {
            entity.connections.forEach(conn => {
                // Ensure target exists
                if (conn.targetSlug && State.atlas.find(e => e.slug === conn.targetSlug)) {
                    elements.push({
                        data: {
                            id: `${entity.slug}-${conn.targetSlug}`,
                            source: entity.slug,
                            target: conn.targetSlug,
                            type: conn.type
                        }
                    });
                }
            });
        }
    });

    // 3. Styling Configuration
    const isDark = State.theme === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#2b2d42';
    const edgeColor = isDark ? '#444444' : '#cccccc';
    
    // 4. Initialize Cytoscape
    const cy = cytoscape({
        container: document.getElementById('cy'),
        elements: elements,
        
        style: [
            // Default Node Style
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'color': textColor,
                    'font-size': '12px',
                    'font-family': 'Inter, sans-serif',
                    'text-valign': 'bottom',
                    'text-margin-y': 6,
                    'text-background-color': isDark ? '#121212' : '#ffffff',
                    'text-background-opacity': 0.7,
                    'text-background-padding': '2px',
                    // Use the calculated size
                    'width': 'data(size)',
                    'height': 'data(size)',
                    'border-width': 2,
                    'border-color': isDark ? '#121212' : '#ffffff',
                    'transition-property': 'background-color, line-color, target-arrow-color',
                    'transition-duration': '0.3s'
                }
            },
            // Specific Node Colors
            { selector: 'node[type="event"]', style: { 'background-color': '#ef233c' } },   // Red
            { selector: 'node[type="actor"]', style: { 'background-color': '#ffb703' } },   // Yellow
            { selector: 'node[type="context"]', style: { 'background-color': '#2b2d42' } }, // Dark Blue
            { selector: 'node[type="theme"]', style: { 'background-color': '#8d99ae' } },   // Gray
            
            // Edge Style
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': edgeColor,
                    'curve-style': 'bezier',
                    'opacity': 0.4,
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': edgeColor,
                    'arrow-scale': 0.8
                }
            },
            // Interaction Styles
            {
                selector: '.highlighted',
                style: {
                    'background-color': '#3498db',
                    'line-color': '#3498db',
                    'target-arrow-color': '#3498db',
                    'transition-duration': '0.2s',
                    'z-index': 999
                }
            },
            {
                selector: '.faded',
                style: {
                    'opacity': 0.1,
                    'text-opacity': 0
                }
            }
        ],

        // Physics Layout (Cola)
        layout: {
            name: 'cola',
            animate: true,
            refresh: 1, // High refresh rate for smooth animation
            maxSimulationTime: 60000,
            ungrabifyWhileSimulating: false,
            fit: false, // Don't fit on every tick, handled initially
            padding: 50,
            
            // PHYSICS PARAMETERS
            // This creates the "Gravity" effect:
            // Short edges between big nodes pull them together.
            edgeLength: function(edge){
                // Get degrees of source and target
                const w1 = edge.source().data('degree') || 1;
                const w2 = edge.target().data('degree') || 1;
                // Higher degree = Shorter edge = More "gravity" pull
                return 200 / (Math.sqrt(w1) + Math.sqrt(w2)); 
            },
            
            // Prevent overlap but allow clustering
            nodeSpacing: function( node ){ 
                return node.data('size') + 10; 
            },
            
            // Infinite simulation for "alive" feel
            infinite: true,
        }
    });

    // Initial Fit (since we turned off auto-fit for physics loop)
    cy.ready(() => {
        cy.fit();
        cy.center();
    });

    // 5. Interaction
    cy.on('tap', 'node', function(evt){
        const slug = evt.target.id();
        window.location.hash = `#/entity/${slug}`;
    });

    // Highlight neighbors on hover
    cy.on('mouseover', 'node', function(e) {
        const node = e.target;
        const neighborhood = node.neighborhood().add(node);
        
        cy.elements().addClass('faded');
        neighborhood.removeClass('faded').addClass('highlighted');
        
        document.body.style.cursor = 'pointer';
    });
    
    cy.on('mouseout', 'node', function(e) {
        cy.elements().removeClass('faded highlighted');
        document.body.style.cursor = 'default';
    });
}