const SHEET_ID = "1oqUud0TG6ZjngJ4CvSpFKd5R7Kit4HGOBhy5MjE2fEc";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Robust CSV Parser
function parseCSV(csv) {
    const lines = csv.split("\n").map(l => l.trim()).filter(l => l);
    const headers = lines[0].split(",");

    return lines.slice(1).map(line => {
        // Regex to split by comma ONLY if not inside double quotes
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        let obj = {};
        headers.forEach((h, i) => {
            let val = values[i] ? values[i].trim() : '';
            // Remove surrounding quotes if present (e.g. "Pop, Rock" -> Pop, Rock)
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1);
            }
            obj[h.trim()] = val;
        });
        return obj;
    });
}

// Helper: Count occurrences
// isList=true handles cells like "Pop, Rock, Indie" by splitting them first
function countFrequency(items, key, isList = false) {
    const map = new Map();
    items.forEach(item => {
        let val = item[key];
        if (!val) return;

        if (isList) {
            // Split by comma, trim whitespace
            const parts = val.split(",").map(p => p.trim());
            parts.forEach(p => {
                if (p) map.set(p, (map.get(p) || 0) + 1);
            });
        } else {
            map.set(val, (map.get(val) || 0) + 1);
        }
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

// Helper: Build calendar data for a given year
function buildCalendarData(data, year) {
    const calendarData = new Map();
    
    data.forEach(item => {
        const ts = item["Timestamp"] || item["End Time"] || "";
        if (!ts) return;

        const date = new Date(ts);
        if (isNaN(date)) return;

        if (date.getFullYear() === year) {
            const dateStr = date.toLocaleDateString('en-US');
            const plays = calendarData.get(dateStr) || 0;
            calendarData.set(dateStr, plays + 1);
        }
    });
    
    return calendarData;
}

// Helper: Get all unique artists from data
function getAllArtists(data) {
    const artists = new Set();
    data.forEach(item => {
        const artist = (item["Artist"] || "").trim();
        if (artist) {
            artists.add(artist);
        }
    });
    return Array.from(artists).sort();
}

// Helper: Convert milliseconds to human-readable time string
function msToTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// Global preview audio reference so only one preview plays at a time
let previewAudioPlayer = null;

function stopPreviewAudio() {
    if (previewAudioPlayer) {
        previewAudioPlayer.pause();
        previewAudioPlayer.currentTime = 0;
        previewAudioPlayer = null;
    }
}

// Fetch a 30s preview (and fallback links) using the public iTunes Search API
async function fetchTrackPreview(songName, artistName = "") {
    const term = [songName, artistName].filter(Boolean).join(" ");
    if (!term) return null;

    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`);
        if (!res.ok) return null;
        const json = await res.json();
        const result = json.results && json.results[0];
        if (!result) return null;
        return {
            previewUrl: result.previewUrl || null,
            externalUrl: result.trackViewUrl || null
        };
    } catch (err) {
        console.warn("Preview fetch failed", err);
        return null;
    }
}

function buildSpotifySearchUrl(songName, artistName = "") {
    const query = [songName, artistName].filter(Boolean).join(" ");
    return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

// Compute per-artist aggregated statistics
function computeArtistStats(data) {
    const map = new Map();

    data.forEach(item => {
        const artist = (item["Artist"] || "").trim();
        if (!artist) return;

        const duration = parseInt(item["Duration"]) || 0;
        const song = (item["Name"] || "").trim();
        const cover = (item["Cover Image"] || item["Cover"] || '').trim();
        const ts = item["Timestamp"] || item["End Time"] || '';
        const date = ts ? new Date(ts) : null;

        if (!map.has(artist)) {
            map.set(artist, {
                name: artist,
                plays: 0,
                totalMs: 0,
                songCounts: new Map(),
                firstListen: null,
                lastListen: null,
                cover: cover || null
            });
        }

        const entry = map.get(artist);
        entry.plays++;
        entry.totalMs += duration;

        if (song) {
            entry.songCounts.set(song, (entry.songCounts.get(song) || 0) + 1);
        }

        if (date && !isNaN(date)) {
            if (!entry.firstListen || date < entry.firstListen) entry.firstListen = date;
            if (!entry.lastListen || date > entry.lastListen) entry.lastListen = date;
        }

        // Prefer a non-empty cover image if we don't have one yet
        if (!entry.cover && cover) entry.cover = cover;
    });

    // Convert map to sorted array with derived topSongs and full song list
    const artists = Array.from(map.values()).map(a => {
        const allSongs = Array.from(a.songCounts.entries())
            .sort((x, y) => y[1] - x[1])
            .map(([name, count]) => ({ name, count }));

        const topSongs = allSongs.slice(0, 3);

        return {
            name: a.name,
            plays: a.plays,
            totalMs: a.totalMs,
            topSongs: topSongs,
            allSongs: allSongs,
            firstListen: a.firstListen,
            lastListen: a.lastListen,
            cover: a.cover
        };
    }).sort((x, y) => y.plays - x.plays);

    return artists;
}

// Compute per-album aggregated statistics
function computeAlbumStats(data) {
    const map = new Map();

    data.forEach(item => {
        const album = (item["Album"] || "").trim();
        if (!album) return;

        const duration = parseInt(item["Duration"]) || 0;
        const song = (item["Name"] || "").trim();
        const cover = (item["Cover Image"] || item["Cover"] || '').trim();
        const ts = item["Timestamp"] || item["End Time"] || '';
        const date = ts ? new Date(ts) : null;

        if (!map.has(album)) {
            map.set(album, {
                name: album,
                plays: 0,
                totalMs: 0,
                trackCounts: new Map(),
                firstListen: null,
                lastListen: null,
                cover: cover || null
            });
        }

        const entry = map.get(album);
        entry.plays++;
        entry.totalMs += duration;

        if (song) {
            entry.trackCounts.set(song, (entry.trackCounts.get(song) || 0) + 1);
        }

        if (date && !isNaN(date)) {
            if (!entry.firstListen || date < entry.firstListen) entry.firstListen = date;
            if (!entry.lastListen || date > entry.lastListen) entry.lastListen = date;
        }

        if (!entry.cover && cover) entry.cover = cover;
    });

    const albums = Array.from(map.values()).map(a => {
        const tracks = Array.from(a.trackCounts.entries())
            .sort((x, y) => y[1] - x[1])
            .map(([name, count]) => ({ name, count }));

        const topTracks = tracks.slice(0, 3);

        return {
            name: a.name,
            plays: a.plays,
            totalMs: a.totalMs,
            tracks: tracks,
            topTracks: topTracks,
            firstListen: a.firstListen,
            lastListen: a.lastListen,
            cover: a.cover
        };
    }).sort((x, y) => y.plays - x.plays);

    return albums;
}

// Compute per-genre aggregated statistics
function computeGenreStats(data) {
    const map = new Map();

    data.forEach(item => {
        const genresRaw = (item["Genres"] || "").trim();
        if (!genresRaw) return;

        const duration = parseInt(item["Duration"]) || 0;
        const song = (item["Name"] || "").trim();
        const cover = (item["Cover Image"] || item["Cover"] || '').trim();
        const ts = item["Timestamp"] || item["End Time"] || '';
        const date = ts ? new Date(ts) : null;

        const genres = genresRaw.split(',').map(g => g.trim()).filter(Boolean);
        genres.forEach(genre => {
            if (!map.has(genre)) {
                map.set(genre, {
                    name: genre,
                    plays: 0,
                    totalMs: 0,
                    trackCounts: new Map(),
                    firstListen: null,
                    lastListen: null,
                    cover: cover || null
                });
            }

            const entry = map.get(genre);
            entry.plays++;
            entry.totalMs += duration;

            if (song) {
                entry.trackCounts.set(song, (entry.trackCounts.get(song) || 0) + 1);
            }

            if (date && !isNaN(date)) {
                if (!entry.firstListen || date < entry.firstListen) entry.firstListen = date;
                if (!entry.lastListen || date > entry.lastListen) entry.lastListen = date;
            }

            if (!entry.cover && cover) entry.cover = cover;
        });
    });

    const genres = Array.from(map.values()).map(g => {
        const tracks = Array.from(g.trackCounts.entries())
            .sort((x, y) => y[1] - x[1])
            .map(([name, count]) => ({ name, count }));

        const topTracks = tracks.slice(0, 3);

        return {
            name: g.name,
            plays: g.plays,
            totalMs: g.totalMs,
            tracks: tracks,
            topTracks: topTracks,
            firstListen: g.firstListen,
            lastListen: g.lastListen,
            cover: g.cover
        };
    }).sort((x, y) => y.plays - x.plays);

    return genres;
}

// Render artist cards into the grid
function renderArtistCards(artists) {
    const container = document.getElementById('artistCardsGrid');
    if (!container) return;
    container.innerHTML = '';

    if (!artists || artists.length === 0) {
        container.innerHTML = '<p style="color:#888;">No artist data available.</p>';
        return;
    }

    artists.forEach(artist => {
        const card = document.createElement('div');
        card.className = 'artist-card';

        const coverDiv = document.createElement('div');
        coverDiv.className = 'artist-cover';
        if (artist.cover) {
            coverDiv.style.backgroundImage = `url('${artist.cover}')`;
        }

        const body = document.createElement('div');
        body.className = 'artist-card-body';

        const nameEl = document.createElement('h3');
        nameEl.className = 'artist-name';
        nameEl.textContent = artist.name;

        const meta = document.createElement('div');
        meta.className = 'artist-meta';
        const playsBadge = document.createElement('div');
        playsBadge.className = 'small-badge';
        playsBadge.textContent = `${artist.plays} plays`;

        const timeBadge = document.createElement('div');
        timeBadge.className = 'artist-time';
        timeBadge.style.color = '#b3b3b3';
        timeBadge.textContent = msToTime(artist.totalMs);

        meta.appendChild(playsBadge);
        meta.appendChild(timeBadge);

        const topSongsEl = document.createElement('div');
        topSongsEl.className = 'artist-top-songs';
        if (artist.topSongs && artist.topSongs.length > 0) {
            const songs = artist.topSongs.map(s => `${s.name} (${s.count})`).join(' • ');
            topSongsEl.textContent = `Top: ${songs}`;
        } else {
            topSongsEl.textContent = 'Top: N/A';
        }

        const listenDates = document.createElement('div');
        listenDates.className = 'artist-listen-dates';
        listenDates.style.fontSize = '0.8rem';
        listenDates.style.color = '#888';
        const first = artist.firstListen ? new Date(artist.firstListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        const last = artist.lastListen ? new Date(artist.lastListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        listenDates.textContent = `First: ${first} • Last: ${last}`;

        body.appendChild(nameEl);
        body.appendChild(meta);
        body.appendChild(topSongsEl);
        body.appendChild(listenDates);

        // Details (hidden by default) - full song list
        const details = document.createElement('div');
        details.className = 'artist-details';
        const ul = document.createElement('ul');
        if (artist.allSongs && artist.allSongs.length > 0) {
            artist.allSongs.slice(0, 20).forEach(s => {
                const li = document.createElement('li');
                li.textContent = `${s.name} — ${s.count} play${s.count !== 1 ? 's' : ''}`;
                ul.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No songs available';
            ul.appendChild(li);
        }
        details.appendChild(ul);

        const expandHint = document.createElement('div');
        expandHint.className = 'artist-expand-hint';
        expandHint.textContent = 'Click to expand for more details';
        body.appendChild(expandHint);

        body.appendChild(details);

        card.appendChild(coverDiv);
        card.appendChild(body);

        // Open modal on click to show full artist details
        card.addEventListener('click', () => {
            openArtistModal(artist);
        });

        container.appendChild(card);
    });
}

// Helper: Find artist collaborations on the same songs
function findArtistCollaborations(data, artistName) {
    const collaborations = new Map(); // Key: artist name, Value: {count, songs: Set}
    
    // Find all songs where the searched artist appears (either as Artist or in Featured Artists)
    const searchedArtistSongs = [];
    data.forEach(item => {
        const artist = (item["Artist"] || "").trim();
        const featuredArtists = (item["Featured Artists"] || "").trim();
        const song = (item["Name"] || "").trim();
        
        // Check if the searched artist is the main artist OR in featured artists
        if ((artist === artistName || featuredArtists.includes(artistName)) && song) {
            searchedArtistSongs.push(song);
        }
    });
    
    // Find all other artists on those same songs
    searchedArtistSongs.forEach(song => {
        data.forEach(item => {
            const artist = (item["Artist"] || "").trim();
            const featuredArtists = (item["Featured Artists"] || "").trim();
            const itemSong = (item["Name"] || "").trim();
            
            // Find artists on this song (excluding the searched artist)
            if (itemSong === song) {
                // Check main artist
                if (artist !== artistName && artist) {
                    if (!collaborations.has(artist)) {
                        collaborations.set(artist, { count: 0, songs: new Set() });
                    }
                    const collab = collaborations.get(artist);
                    collab.count++;
                    collab.songs.add(song);
                }
                
                // Check featured artists
                if (featuredArtists) {
                    const featured = featuredArtists.split(',').map(a => a.trim());
                    featured.forEach(feat => {
                        if (feat !== artistName && feat) {
                            if (!collaborations.has(feat)) {
                                collaborations.set(feat, { count: 0, songs: new Set() });
                            }
                            const collab = collaborations.get(feat);
                            collab.count++;
                            collab.songs.add(song);
                        }
                    });
                }
            }
        });
    });
    
    // Convert to array and sort by collaboration count
    return Array.from(collaborations.entries())
        .map(([artist, data]) => ({
            name: artist,
            count: data.count,
            songs: Array.from(data.songs).sort()
        }))
        .sort((a, b) => b.count - a.count);
}

// Build collaboration network data for D3 visualization
function buildCollaborationNetwork(data) {
    const artists = new Map(); // name -> { plays, totalMs, featured count }
    const links = new Map(); // "artistA-artistB" -> { count, songs }
    
    // Count artist plays and find all collaborations
    data.forEach(item => {
        const artist = (item["Artist"] || "").trim();
        const featured = (item["Featured Artists"] || "")
            .split(',')
            .map(a => a.trim())
            .filter(a => a);
        const song = (item["Name"] || "").trim();
        const duration = parseInt(item["Duration"]) || 0;
        
        if (artist) {
            if (!artists.has(artist)) {
                artists.set(artist, { plays: 0, totalMs: 0, featured: 0 });
            }
            const a = artists.get(artist);
            a.plays++;
            a.totalMs += duration;
        }
        
        // Count featured appearances
        featured.forEach(feat => {
            if (!artists.has(feat)) {
                artists.set(feat, { plays: 0, totalMs: 0, featured: 0 });
            }
            artists.get(feat).featured++;
        });
        
        // Build links between main artist and featured artists
        if (artist && featured.length > 0) {
            featured.forEach(feat => {
                const key = [artist, feat].sort().join('|');
                if (!links.has(key)) {
                    links.set(key, { count: 0, songs: new Set() });
                }
                const link = links.get(key);
                link.count++;
                link.songs.add(song);
            });
        }
        
        // Build links between featured artists
        for (let i = 0; i < featured.length; i++) {
            for (let j = i + 1; j < featured.length; j++) {
                const key = [featured[i], featured[j]].sort().join('|');
                if (!links.has(key)) {
                    links.set(key, { count: 0, songs: new Set() });
                }
                const link = links.get(key);
                link.count++;
                link.songs.add(song);
            }
        }
    });
    
    // Convert to D3 format
    const nodes = Array.from(artists.entries()).map(([name, stats]) => ({
        id: name,
        plays: stats.plays,
        featured: stats.featured,
        value: stats.plays + stats.featured * 0.5 // Size by plays + featured weight
    }));
    
    const networkLinks = Array.from(links.entries()).map(([key, linkData]) => {
        const [source, target] = key.split('|');
        return {
            source: source,
            target: target,
            value: linkData.count,
            songs: Array.from(linkData.songs)
        };
    });
    
    return { nodes, links: networkLinks };
}

// Render collaboration network using D3.js
function renderCollaborationNetwork(data) {
    const container = document.getElementById('collabNetworkContainer');
    if (!container) return;
    
    const { nodes, links } = buildCollaborationNetwork(data);
    
    // Clear previous SVG
    d3.select('#collabNetworkContainer').selectAll('*').remove();

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create SVG and group for zoom/pan
    const svg = d3.select('#collabNetworkContainer')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#1a1a1a');

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.2, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Create force simulation with gentler repulsion and stronger link strength
    // Slightly reduced link distance and strength to make groups less tightly forced
    const linkForce = d3.forceLink(links)
        .id(d => d.id)
        // baseline distance smaller (nodes closer), but capped
        .distance(d => 100 - Math.min(d.value * 6, 60))
        // weaker overall link strength
        .strength(d => Math.min(0.6, 0.08 + d.value * 0.04));

    const simulation = d3.forceSimulation(nodes)
        .force('link', linkForce)
        .force('charge', d3.forceManyBody().strength(-60))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.value) * 4 + 6));

    // Create links inside group
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'collab-link')
        .attr('stroke-width', d => Math.max(1, Math.min(d.value, 5)))
        .on('mouseover', function(event, d) {
            const tooltip = document.getElementById('tooltip');
            // Show up to 6 songs in tooltip
            const max = 6;
            const songs = (d.songs || []).slice(0, max).join(', ');
            const more = (d.songs && d.songs.length > max) ? ` +${d.songs.length - max} more` : '';
            tooltip.textContent = `${d.source.id} ↔ ${d.target.id}: ${songs}${more}`;
            tooltip.style.opacity = '1';
        })
        .on('mousemove', function(event) {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.left = (event.clientX + 12) + 'px';
            tooltip.style.top = (event.clientY + 12) + 'px';
        })
        .on('mouseout', function() {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.opacity = '0';
        });

    // Create nodes inside group
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('class', 'collab-node')
        .attr('r', d => Math.sqrt(d.value) * 4 + 6)
        .attr('fill', '#1db954')
        .call(d3.drag()
            .on('start', dragStart)
            .on('drag', dragged)
            .on('end', dragEnd));

    // Create labels inside group
    const labels = g.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text(d => {
            const name = d.id;
            return name.length > 20 ? name.substring(0, 17) + '...' : name;
        })
        .style('font-size', d => Math.min(14, Math.sqrt(d.value) * 2 + 10) + 'px');

    // Add tooltip for nodes
    node.on('mouseover', function(event, d) {
        d3.select(this).attr('r', Math.sqrt(d.value) * 4 + 10);

        const tooltip = document.getElementById('tooltip');
        tooltip.textContent = `${d.id} — ${d.plays} plays`;
        tooltip.style.opacity = '1';
    }).on('mousemove', function(event) {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.left = (event.clientX + 12) + 'px';
        tooltip.style.top = (event.clientY + 12) + 'px';
    }).on('mouseout', function(event, d) {
        d3.select(this).attr('r', Math.sqrt(d.value) * 4 + 6);
        const tooltip = document.getElementById('tooltip');
        tooltip.style.opacity = '0';
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        labels
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    });

    // Drag functions
    function dragStart(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnd(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Resize handling: adjust svg size and center force
    function resize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        svg.attr('width', w).attr('height', h);
        simulation.force('center', d3.forceCenter(w / 2, h / 2));
        simulation.alpha(0.3).restart();
    }

    window.addEventListener('resize', resize);

    // Reset and Fit view controls
    const fitBtn = document.getElementById('collabFitBtn');
    const resetBtn = document.getElementById('collabResetBtn');

    function resetView() {
        // Smoothly reset zoom to identity
        svg.transition().duration(450).call(zoom.transform, d3.zoomIdentity);
    }

    function fitView() {
        if (!nodes || nodes.length === 0) return;
        // Compute bounding box of nodes
        const xs = nodes.map(n => n.x);
        const ys = nodes.map(n => n.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const padding = 40;
        const boxWidth = (maxX - minX) || 1;
        const boxHeight = (maxY - minY) || 1;

        const k = Math.min((container.clientWidth - padding) / boxWidth, (container.clientHeight - padding) / boxHeight);
        const scale = Math.max(0.2, Math.min(4, k * 0.9));

        const tx = (container.clientWidth / 2) - scale * (minX + boxWidth / 2);
        const ty = (container.clientHeight / 2) - scale * (minY + boxHeight / 2);

        const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
        svg.transition().duration(600).call(zoom.transform, transform);
    }

    if (fitBtn) fitBtn.onclick = fitView;
    if (resetBtn) resetBtn.onclick = resetView;
}

function renderCollaborationResults(results, searchArtist) {
    const container = document.getElementById('collaborationResults');
    container.innerHTML = '';
    
    if (results.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'collaboration-pair empty-state';
        emptyEl.innerHTML = '<div class="empty-collab-message">No collaborations found for "' + searchArtist + '"</div>';
        container.appendChild(emptyEl);
        return;
    }
    
    results.forEach(collab => {
        const collabEl = document.createElement('div');
        collabEl.className = 'collaboration-pair';
        
        // Show first 3 songs, with indication of more if there are additional
        const songsToShow = collab.songs.slice(0, 3);
        const remainingCount = collab.songs.length - songsToShow.length;
        
        let songsHtml = songsToShow.map(song => `
            <div class="collaboration-song">
                <div class="collaboration-song-name">${song}</div>
            </div>
        `).join('');
        
        if (remainingCount > 0) {
            songsHtml += `
                <div class="collaboration-song" style="opacity: 0.7;">
                    <div class="collaboration-song-name">+${remainingCount} more song${remainingCount !== 1 ? 's' : ''}</div>
                </div>
            `;
        }
        
        collabEl.innerHTML = `
            <div class="collaboration-header">
                <div class="artist-badge">${searchArtist}</div>
                <div class="collab-plus">+</div>
                <div class="artist-badge">${collab.name}</div>
            </div>
            <div class="collaboration-song-info">
                ${songsHtml}
            </div>
        `;
        
        container.appendChild(collabEl);
    });
}

// Song modal helpers
function getSongDetails(data, songName) {
    const details = {
        name: songName,
        plays: 0,
        totalMs: 0,
        artists: new Map(),
        albums: new Map(),
        featuredArtists: new Map(),
        genres: new Map(),
        firstListen: null,
        lastListen: null,
        cover: null
    };

    data.forEach(item => {
        if ((item["Name"] || "").trim() !== songName) return;

        details.plays++;
        const duration = parseInt(item["Duration"]) || 0;
        details.totalMs += duration;

        const artist = (item["Artist"] || "").trim();
        if (artist) details.artists.set(artist, (details.artists.get(artist) || 0) + 1);

        const album = (item["Album"] || "").trim();
        if (album) details.albums.set(album, (details.albums.get(album) || 0) + 1);

        const featured = (item["Featured Artists"] || "").split(",").map(a => a.trim()).filter(Boolean);
        featured.forEach(f => details.featuredArtists.set(f, (details.featuredArtists.get(f) || 0) + 1));

        const genres = (item["Genres"] || "").split(",").map(g => g.trim()).filter(Boolean);
        genres.forEach(g => details.genres.set(g, (details.genres.get(g) || 0) + 1));

        const coverCandidate = (item["Cover Image"] || item["Cover"] || "").trim();
        if (!details.cover && coverCandidate) details.cover = coverCandidate;

        const ts = item["Timestamp"] || item["End Time"] || "";
        if (ts) {
            const date = new Date(ts);
            if (!isNaN(date)) {
                if (!details.firstListen || date < details.firstListen) details.firstListen = date;
                if (!details.lastListen || date > details.lastListen) details.lastListen = date;
            }
        }
    });

    const toSortedArray = (map) => Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

    return {
        ...details,
        artists: toSortedArray(details.artists),
        albums: toSortedArray(details.albums),
        featuredArtists: toSortedArray(details.featuredArtists),
        genres: toSortedArray(details.genres),
        avgMs: details.plays > 0 ? Math.round(details.totalMs / details.plays) : 0
    };
}

function openSongModal(songName) {
    const overlay = document.getElementById('songModal');
    const body = document.getElementById('songModalBody');
    if (!overlay || !body || !window.allData) return;

    const song = getSongDetails(window.allData, songName);

    body.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const cover = document.createElement('div');
    cover.className = 'modal-cover';
    if (song.cover) cover.style.backgroundImage = `url('${song.cover}')`;

    const hdiv = document.createElement('div');
    const title = document.createElement('h3');
    title.id = 'songModalTitle';
    title.className = 'modal-title';
    title.textContent = song.name;

    const meta = document.createElement('div');
    meta.className = 'modal-meta';
    const avgTime = song.avgMs ? msToTime(song.avgMs) : '0m';
    meta.textContent = `${song.plays} play${song.plays === 1 ? '' : 's'} • ${msToTime(song.totalMs)} • Avg ${avgTime}/play`;

    hdiv.appendChild(title);
    hdiv.appendChild(meta);

    header.appendChild(cover);
    header.appendChild(hdiv);
    body.appendChild(header);

    const dates = document.createElement('div');
    dates.className = 'modal-meta';
    const first = song.firstListen ? new Date(song.firstListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    const last = song.lastListen ? new Date(song.lastListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    dates.textContent = `First listened: ${first} • Last listened: ${last}`;
    body.appendChild(dates);

    const primaryArtist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';

    // Playback helper + Spotify link
    const previewCard = document.createElement('div');
    previewCard.className = 'preview-card';
    const previewInfo = document.createElement('div');
    previewInfo.className = 'preview-status';
    previewInfo.textContent = 'Loading preview...';

    const actionsRow = document.createElement('div');
    actionsRow.className = 'preview-actions';

    const playBtn = document.createElement('button');
    playBtn.className = 'preview-btn';
    playBtn.textContent = 'Play preview';
    playBtn.disabled = true;

    const spotifyLink = document.createElement('a');
    spotifyLink.className = 'preview-link';
    spotifyLink.href = buildSpotifySearchUrl(song.name, primaryArtist);
    spotifyLink.target = '_blank';
    spotifyLink.rel = 'noopener';
    spotifyLink.textContent = 'Open in Spotify';

    actionsRow.appendChild(playBtn);
    actionsRow.appendChild(spotifyLink);

    previewCard.appendChild(previewInfo);
    previewCard.appendChild(actionsRow);
    body.appendChild(previewCard);

    const listWrap = document.createElement('div');
    listWrap.className = 'modal-body-chips';

    function addSection(titleText, items, emptyText, chipClass = '') {
        const section = document.createElement('div');
        section.className = 'modal-section-inline';

        const label = document.createElement('div');
        label.className = 'modal-chip-label';
        label.textContent = titleText;
        section.appendChild(label);

        const chipsRow = document.createElement('div');
        chipsRow.className = 'modal-chip-row';

        if (!items || items.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'modal-chip-empty';
            empty.textContent = emptyText;
            chipsRow.appendChild(empty);
        } else {
            items.slice(0, 8).forEach(entry => {
                const chip = document.createElement('span');
                chip.className = `modal-chip ${chipClass}`.trim();
                chip.textContent = entry.name;
                chipsRow.appendChild(chip);
            });
        }

        section.appendChild(chipsRow);
        listWrap.appendChild(section);
    }

    addSection('Artists', song.artists, 'No artist data', 'chip-artist');
    addSection('Albums', song.albums, 'No album data', 'chip-album');
    addSection('Featured Artists', song.featuredArtists, 'No featured artists', 'chip-featured');
    addSection('Genres', song.genres, 'No genres found', 'chip-genre');

    body.appendChild(listWrap);

    // Add daily heatmap section
    const songHeatmapSection = document.createElement('div');
    songHeatmapSection.className = 'modal-heatmap-section';
    const heatmapTitle = document.createElement('h4');
    heatmapTitle.textContent = 'Listening Activity (By Day)';
    heatmapTitle.style.marginBottom = '12px';
    songHeatmapSection.appendChild(heatmapTitle);
    
    const heatmapContainer = document.createElement('div');
    heatmapContainer.id = `song-heatmap-${songName.replace(/[^a-zA-Z0-9]/g, '-')}`;
    heatmapContainer.className = 'song-calendar-grid';
    songHeatmapSection.appendChild(heatmapContainer);
    
    body.appendChild(songHeatmapSection);
    
    // Render the song-specific heatmap
    renderSongDailyHeatmap(window.allData, songName, heatmapContainer);

    // Load preview in the background
    (async () => {
        const previewData = await fetchTrackPreview(song.name, primaryArtist);
        if (!previewData || !previewData.previewUrl) {
            previewInfo.textContent = 'Preview not available for this track.';
            playBtn.disabled = true;
            playBtn.classList.add('preview-btn-disabled');
            return;
        }

        previewInfo.textContent = 'Ready to play a 30s preview.';
        playBtn.disabled = false;

        playBtn.onclick = () => {
            if (!previewData.previewUrl) return;
            if (!previewAudioPlayer || previewAudioPlayer.src !== previewData.previewUrl) {
                stopPreviewAudio();
                previewAudioPlayer = new Audio(previewData.previewUrl);
                previewAudioPlayer.onended = () => {
                    playBtn.textContent = 'Play preview';
                    previewInfo.textContent = 'Preview ended.';
                };
                previewAudioPlayer.onerror = () => {
                    previewInfo.textContent = 'Preview failed to play.';
                    playBtn.disabled = true;
                    playBtn.classList.add('preview-btn-disabled');
                };
            }

            if (previewAudioPlayer.paused) {
                previewAudioPlayer.play();
                playBtn.textContent = 'Pause preview';
                previewInfo.textContent = 'Playing preview...';
            } else {
                previewAudioPlayer.pause();
                playBtn.textContent = 'Play preview';
                previewInfo.textContent = 'Preview paused.';
            }
        };
    })();

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('open'));
    overlay.setAttribute('aria-hidden', 'false');

    const closeBtn = document.getElementById('songModalClose');
    if (closeBtn) {
        closeBtn.onclick = closeSongModal;
    }

    overlay.onclick = (e) => {
        if (e.target === overlay) closeSongModal();
    };

    document.addEventListener('keydown', songModalKeyHandler);
}

function closeSongModal() {
    const overlay = document.getElementById('songModal');
    if (!overlay) return;
    stopPreviewAudio();
    overlay.classList.remove('open');
    const onTransitionEnd = (e) => {
        if (e.target === overlay) {
            overlay.style.display = 'none';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.removeEventListener('transitionend', onTransitionEnd);
        }
    };
    overlay.addEventListener('transitionend', onTransitionEnd);
    document.removeEventListener('keydown', songModalKeyHandler);
}

function songModalKeyHandler(e) {
    if (e.key === 'Escape') closeSongModal();
}

// Modal helpers
function openArtistModal(artist) {
    const overlay = document.getElementById('artistModal');
    const body = document.getElementById('modalBody');
    if (!overlay || !body) return;

    // Build modal content
    body.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const cover = document.createElement('div');
    cover.className = 'modal-cover';
    if (artist.cover) cover.style.backgroundImage = `url('${artist.cover}')`;

    const hdiv = document.createElement('div');
    const title = document.createElement('h3');
    title.id = 'modalTitle';
    title.className = 'modal-title';
    title.textContent = artist.name;

    const meta = document.createElement('div');
    meta.className = 'modal-meta';
    meta.textContent = `${artist.plays} plays • ${msToTime(artist.totalMs)}`;

    hdiv.appendChild(title);
    hdiv.appendChild(meta);

    header.appendChild(cover);
    header.appendChild(hdiv);

    body.appendChild(header);

    // Dates
    const dates = document.createElement('div');
    dates.className = 'modal-meta';
    const first = artist.firstListen ? new Date(artist.firstListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    const last = artist.lastListen ? new Date(artist.lastListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    dates.textContent = `First listened: ${first} • Last listened: ${last}`;
    body.appendChild(dates);

    // Full song list (formatted like the Period Songs list: left = name, right = count)
    const listWrap = document.createElement('div');
    listWrap.className = 'modal-body-list';
    const ul = document.createElement('ul');

    const songs = (artist.allSongs && artist.allSongs.length > 0) ? artist.allSongs : [];
    const maxVisible = 10;

    if (songs.length === 0) {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'song-name';
        nameSpan.textContent = 'No songs available';
        li.appendChild(nameSpan);
        ul.appendChild(li);
    } else {
        songs.forEach((s, idx) => {
            const li = document.createElement('li');
            if (idx >= maxVisible) li.classList.add('extra-song');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'song-name';
            nameSpan.textContent = s.name;

            const countSpan = document.createElement('span');
            countSpan.className = 'song-count';
            countSpan.textContent = `${s.count} ${s.count === 1 ? 'play' : 'plays'}`;

            li.appendChild(nameSpan);
            li.appendChild(countSpan);
            ul.appendChild(li);
        });
    }

    listWrap.appendChild(ul);

    // If there are more songs than maxVisible, add a Show more toggle
    if (songs.length > maxVisible) {
        const btn = document.createElement('button');
        btn.className = 'modal-show-more';
        btn.textContent = `Show more (${songs.length - maxVisible})`;
        let expanded = false;
        btn.addEventListener('click', () => {
            expanded = !expanded;
            const extras = listWrap.querySelectorAll('.extra-song');
            extras.forEach(el => {
                el.style.display = expanded ? 'flex' : 'none';
            });
            btn.textContent = expanded ? 'Show less' : `Show more (${songs.length - maxVisible})`;
        });

        // Initially hide extra items
        listWrap.querySelectorAll('.extra-song').forEach(el => el.style.display = 'none');
        listWrap.appendChild(btn);
    }

    body.appendChild(listWrap);

    // Add daily heatmap section
    const artistHeatmapSection = document.createElement('div');
    artistHeatmapSection.className = 'modal-heatmap-section';
    const heatmapTitle = document.createElement('h4');
    heatmapTitle.textContent = 'Listening Activity (By Day)';
    heatmapTitle.style.marginBottom = '12px';
    artistHeatmapSection.appendChild(heatmapTitle);
    
    const heatmapContainer = document.createElement('div');
    heatmapContainer.id = `artist-heatmap-${artist.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
    heatmapContainer.className = 'song-calendar-grid';
    artistHeatmapSection.appendChild(heatmapContainer);
    
    body.appendChild(artistHeatmapSection);
    
    // Render the artist-specific heatmap
    renderArtistDailyHeatmap(window.allData, artist.name, heatmapContainer);

    // Show overlay with animation: ensure display then add class
    overlay.style.display = 'flex';
    // allow next frame to pick up display change
    requestAnimationFrame(() => overlay.classList.add('open'));
    overlay.setAttribute('aria-hidden', 'false');

    // Attach close handlers (close button exists in DOM)
    const closeBtn = document.getElementById('modalClose');
    if (closeBtn) {
        closeBtn.onclick = closeArtistModal;
    }

    // Close on overlay click (but not when clicking inside content)
    overlay.onclick = (e) => {
        if (e.target === overlay) closeArtistModal();
    };

    // Close on Escape
    document.addEventListener('keydown', modalKeyHandler);
}

// Modal for album details (reuse the same overlay as artist modal for consistency)
function openAlbumModal(album) {
    const overlay = document.getElementById('artistModal');
    const body = document.getElementById('modalBody');
    if (!overlay || !body) return;

    body.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const cover = document.createElement('div');
    cover.className = 'modal-cover';
    if (album.cover) cover.style.backgroundImage = `url('${album.cover}')`;

    const hdiv = document.createElement('div');
    const title = document.createElement('h3');
    title.id = 'modalTitle';
    title.className = 'modal-title';
    title.textContent = album.name;

    const meta = document.createElement('div');
    meta.className = 'modal-meta';
    meta.textContent = `${album.plays} plays • ${msToTime(album.totalMs)}`;

    hdiv.appendChild(title);
    hdiv.appendChild(meta);

    header.appendChild(cover);
    header.appendChild(hdiv);

    body.appendChild(header);

    const dates = document.createElement('div');
    dates.className = 'modal-meta';
    const first = album.firstListen ? new Date(album.firstListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    const last = album.lastListen ? new Date(album.lastListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    dates.textContent = `First listened: ${first} • Last listened: ${last}`;
    body.appendChild(dates);

    // Track list for the album
    const listWrap = document.createElement('div');
    listWrap.className = 'modal-body-list';
    const ul = document.createElement('ul');

    const tracks = (album.tracks && album.tracks.length > 0) ? album.tracks : [];
    const maxVisible = 10;

    if (tracks.length === 0) {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'song-name';
        nameSpan.textContent = 'No tracks available';
        li.appendChild(nameSpan);
        ul.appendChild(li);
    } else {
        tracks.forEach((t, idx) => {
            const li = document.createElement('li');
            if (idx >= maxVisible) li.classList.add('extra-song');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'song-name';
            nameSpan.textContent = t.name;

            const countSpan = document.createElement('span');
            countSpan.className = 'song-count';
            countSpan.textContent = `${t.count} ${t.count === 1 ? 'play' : 'plays'}`;

            li.appendChild(nameSpan);
            li.appendChild(countSpan);
            ul.appendChild(li);
        });
    }

    listWrap.appendChild(ul);

    if (tracks.length > maxVisible) {
        const btn = document.createElement('button');
        btn.className = 'modal-show-more';
        btn.textContent = `Show more (${tracks.length - maxVisible})`;
        let expanded = false;
        btn.addEventListener('click', () => {
            expanded = !expanded;
            const extras = listWrap.querySelectorAll('.extra-song');
            extras.forEach(el => {
                el.style.display = expanded ? 'flex' : 'none';
            });
            btn.textContent = expanded ? 'Show less' : `Show more (${tracks.length - maxVisible})`;
        });

        listWrap.querySelectorAll('.extra-song').forEach(el => el.style.display = 'none');
        listWrap.appendChild(btn);
    }

    body.appendChild(listWrap);

    // Add daily heatmap section
    const albumHeatmapSection = document.createElement('div');
    albumHeatmapSection.className = 'modal-heatmap-section';
    const heatmapTitle = document.createElement('h4');
    heatmapTitle.textContent = 'Listening Activity (By Day)';
    heatmapTitle.style.marginBottom = '12px';
    albumHeatmapSection.appendChild(heatmapTitle);
    
    const heatmapContainer = document.createElement('div');
    heatmapContainer.id = `album-heatmap-${album.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
    heatmapContainer.className = 'song-calendar-grid';
    albumHeatmapSection.appendChild(heatmapContainer);
    
    body.appendChild(albumHeatmapSection);
    
    // Render the album-specific heatmap
    renderAlbumDailyHeatmap(window.allData, album.name, heatmapContainer);

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('open'));
    overlay.setAttribute('aria-hidden', 'false');

    const closeBtn = document.getElementById('modalClose');
    if (closeBtn) {
        closeBtn.onclick = closeArtistModal;
    }

    overlay.onclick = (e) => {
        if (e.target === overlay) closeArtistModal();
    };

    document.addEventListener('keydown', modalKeyHandler);
}

// Modal for genre details (reuse artist overlay)
function openGenreModal(genre) {
    const overlay = document.getElementById('artistModal');
    const body = document.getElementById('modalBody');
    if (!overlay || !body) return;

    body.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const cover = document.createElement('div');
    cover.className = 'modal-cover';
    if (genre.cover) cover.style.backgroundImage = `url('${genre.cover}')`;

    const hdiv = document.createElement('div');
    const title = document.createElement('h3');
    title.id = 'modalTitle';
    title.className = 'modal-title';
    title.textContent = genre.name;

    const meta = document.createElement('div');
    meta.className = 'modal-meta';
    meta.textContent = `${genre.plays} plays • ${msToTime(genre.totalMs)}`;

    hdiv.appendChild(title);
    hdiv.appendChild(meta);

    header.appendChild(cover);
    header.appendChild(hdiv);

    body.appendChild(header);

    const dates = document.createElement('div');
    dates.className = 'modal-meta';
    const first = genre.firstListen ? new Date(genre.firstListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    const last = genre.lastListen ? new Date(genre.lastListen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    dates.textContent = `First listened: ${first} • Last listened: ${last}`;
    body.appendChild(dates);

    // Track list for the genre
    const listWrap = document.createElement('div');
    listWrap.className = 'modal-body-list';
    const ul = document.createElement('ul');

    const tracks = (genre.tracks && genre.tracks.length > 0) ? genre.tracks : [];
    const maxVisible = 10;

    if (tracks.length === 0) {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'song-name';
        nameSpan.textContent = 'No tracks available';
        li.appendChild(nameSpan);
        ul.appendChild(li);
    } else {
        tracks.forEach((t, idx) => {
            const li = document.createElement('li');
            if (idx >= maxVisible) li.classList.add('extra-song');

            const nameSpan = document.createElement('span');
            nameSpan.className = 'song-name';
            nameSpan.textContent = t.name;

            const countSpan = document.createElement('span');
            countSpan.className = 'song-count';
            countSpan.textContent = `${t.count} ${t.count === 1 ? 'play' : 'plays'}`;

            li.appendChild(nameSpan);
            li.appendChild(countSpan);
            ul.appendChild(li);
        });
    }

    listWrap.appendChild(ul);

    if (tracks.length > maxVisible) {
        const btn = document.createElement('button');
        btn.className = 'modal-show-more';
        btn.textContent = `Show more (${tracks.length - maxVisible})`;
        let expanded = false;
        btn.addEventListener('click', () => {
            expanded = !expanded;
            const extras = listWrap.querySelectorAll('.extra-song');
            extras.forEach(el => {
                el.style.display = expanded ? 'flex' : 'none';
            });
            btn.textContent = expanded ? 'Show less' : `Show more (${tracks.length - maxVisible})`;
        });

        listWrap.querySelectorAll('.extra-song').forEach(el => el.style.display = 'none');
        listWrap.appendChild(btn);
    }

    body.appendChild(listWrap);

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('open'));
    overlay.setAttribute('aria-hidden', 'false');

    const closeBtn = document.getElementById('modalClose');
    if (closeBtn) {
        closeBtn.onclick = closeArtistModal;
    }

    overlay.onclick = (e) => {
        if (e.target === overlay) closeArtistModal();
    };

    document.addEventListener('keydown', modalKeyHandler);
}

function closeArtistModal() {
    const overlay = document.getElementById('artistModal');
    if (!overlay) return;
    // start closing animation then hide after transition
    overlay.classList.remove('open');
    const onTransitionEnd = (e) => {
        if (e.target === overlay) {
            overlay.style.display = 'none';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.removeEventListener('transitionend', onTransitionEnd);
        }
    };
    overlay.addEventListener('transitionend', onTransitionEnd);
    document.removeEventListener('keydown', modalKeyHandler);
}

function modalKeyHandler(e) {
    if (e.key === 'Escape') closeArtistModal();
}

function renderCalendarHeatmap(data, year = new Date().getFullYear(), month = new Date().getMonth()) {
    const calendarData = buildCalendarData(data, year);
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Update year display
    document.getElementById('calendarYear').textContent = `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month, 1))} ${year}`;
    
    // Get max plays for color intensity
    const maxPlays = Math.max(...Array.from(calendarData.values()), 1);
    
    // Month names
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Add day labels (Sun-Sat)
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(label => {
        const labelEl = document.createElement('div');
        labelEl.className = 'calendar-day-label';
        labelEl.textContent = label;
        grid.appendChild(labelEl);
    });
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day calendar-day-empty';
        grid.appendChild(emptyCell);
    }
    
    // Get days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add day cells for the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toLocaleDateString('en-US');
        const plays = calendarData.get(dateStr) || 0;
        
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.dataset.date = dateStr;
        dayCell.dataset.plays = plays;
        dayCell.textContent = day;
        dayCell.style.fontSize = '0.75rem';
        dayCell.style.display = 'flex';
        dayCell.style.alignItems = 'center';
        dayCell.style.justifyContent = 'center';
        dayCell.style.color = '#fff';
        
        // Color intensity based on plays - matching the hour heatmap
        if (plays > 0) {
            const intensity = plays / maxPlays;
            const green = Math.floor(50 + intensity * 150); // Same formula as hour heatmap
            dayCell.style.backgroundColor = `rgb(0, ${green}, 0)`;
        } else {
            dayCell.style.backgroundColor = '#222';
        }
        
        // Add tooltip
        dayCell.addEventListener('mouseenter', (e) => {
            const tooltip = document.getElementById('tooltip');
            const dateStr = e.currentTarget.dataset.date;
            const plays = parseInt(e.currentTarget.dataset.plays);
            tooltip.textContent = `${dateStr}: ${plays} ${plays === 1 ? 'play' : 'plays'}`;
            tooltip.style.opacity = '1';
        });
        
        dayCell.addEventListener('mousemove', (e) => {
            const tooltip = document.getElementById('tooltip');
            const offset = 12;
            tooltip.style.left = (e.clientX + offset) + 'px';
            tooltip.style.top = (e.clientY + offset) + 'px';
        });
        
        dayCell.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.opacity = '0';
        });
        
        grid.appendChild(dayCell);
    }
    
    // Render legend - matching hour heatmap colors
    const legendScale = document.querySelector('.legend-scale');
    legendScale.innerHTML = '';
    const steps = 5;
    for (let i = 0; i < steps; i++) {
        const step = document.createElement('div');
        const intensity = i / (steps - 1);
        const green = Math.floor(50 + intensity * 150); // Same formula as hour heatmap
        step.style.backgroundColor = `rgb(0, ${green}, 0)`;
        legendScale.appendChild(step);
    }
}

// Helper: Render daily heatmap for a specific song
function renderSongDailyHeatmap(data, songName, containerEl) {
    if (!containerEl) return;
    
    // Filter data for this song
    const songData = data.filter(item => item["Name"] === songName);
    if (songData.length === 0) {
        containerEl.innerHTML = '<p style="color: #888; text-align: center;">No listening data for this song.</p>';
        return;
    }
    
    // Build date-based play count map
    const datePlayCount = {};
    songData.forEach(item => {
        const timestamp = item["Timestamp"] || item["End Time"] || "";
        if (!timestamp) return;
        const date = new Date(timestamp);
        if (isNaN(date)) return;
        const dateStr = date.toLocaleDateString('en-US');
        datePlayCount[dateStr] = (datePlayCount[dateStr] || 0) + 1;
    });
    
    const maxPlays = Math.max(...Object.values(datePlayCount), 1);
    
    containerEl.innerHTML = '';
    
    // Add day labels (Sun-Sat)
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(label => {
        const labelEl = document.createElement('div');
        labelEl.className = 'song-calendar-day-label';
        labelEl.textContent = label;
        containerEl.appendChild(labelEl);
    });
    
    // Get date range from song data
    const dates = songData
        .map(item => new Date(item["Timestamp"] || item["End Time"] || ""))
        .filter(d => !isNaN(d))
        .sort((a, b) => a - b);
    
    if (dates.length === 0) {
        containerEl.innerHTML = '<p style="color: #888; text-align: center;">No valid dates found.</p>';
        return;
    }
    
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);
    
    // Generate all dates in range
    const allDates = [];
    const current = new Date(firstDate);
    while (current <= lastDate) {
        allDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    
    // Get first day of week for alignment
    const firstDayOfWeek = firstDate.getDay();
    
    // Add empty cells before first date
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'song-calendar-day song-calendar-day-empty';
        containerEl.appendChild(emptyCell);
    }
    
    // Add day cells
    allDates.forEach(date => {
        const dateStr = date.toLocaleDateString('en-US');
        const plays = datePlayCount[dateStr] || 0;
        
        const dayCell = document.createElement('div');
        dayCell.className = 'song-calendar-day';
        dayCell.dataset.date = dateStr;
        dayCell.dataset.plays = plays;
        dayCell.textContent = date.getDate();
        
        if (plays > 0) {
            const intensity = plays / maxPlays;
            const green = Math.floor(50 + intensity * 150);
            dayCell.style.backgroundColor = `rgb(0, ${green}, 0)`;
        } else {
            dayCell.style.backgroundColor = '#222';
        }
        
        // Add tooltip
        dayCell.addEventListener('mouseenter', (e) => {
            const tooltip = document.getElementById('tooltip');
            const dateStr = e.currentTarget.dataset.date;
            const plays = parseInt(e.currentTarget.dataset.plays);
            tooltip.textContent = `${dateStr}: ${plays} ${plays === 1 ? 'play' : 'plays'}`;
            tooltip.style.opacity = '1';
        });
        
        dayCell.addEventListener('mousemove', (e) => {
            const tooltip = document.getElementById('tooltip');
            const offset = 12;
            tooltip.style.left = (e.clientX + offset) + 'px';
            tooltip.style.top = (e.clientY + offset) + 'px';
        });
        
        dayCell.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.opacity = '0';
        });
        
        containerEl.appendChild(dayCell);
    });
}

// Helper: Render daily heatmap for a specific artist
function renderArtistDailyHeatmap(data, artistName, containerEl) {
    if (!containerEl) return;
    
    // Filter data for this artist
    const artistData = data.filter(item => item["Artist"] === artistName);
    if (artistData.length === 0) {
        containerEl.innerHTML = '<p style="color: #888; text-align: center;">No listening data for this artist.</p>';
        return;
    }
    
    // Build date-based play count map
    const datePlayCount = {};
    artistData.forEach(item => {
        const timestamp = item["Timestamp"] || item["End Time"] || "";
        if (!timestamp) return;
        const date = new Date(timestamp);
        if (isNaN(date)) return;
        const dateStr = date.toLocaleDateString('en-US');
        datePlayCount[dateStr] = (datePlayCount[dateStr] || 0) + 1;
    });
    
    const maxPlays = Math.max(...Object.values(datePlayCount), 1);
    
    containerEl.innerHTML = '';
    
    // Add day labels (Sun-Sat)
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(label => {
        const labelEl = document.createElement('div');
        labelEl.className = 'song-calendar-day-label';
        labelEl.textContent = label;
        containerEl.appendChild(labelEl);
    });
    
    // Get date range from artist data
    const dates = artistData
        .map(item => new Date(item["Timestamp"] || item["End Time"] || ""))
        .filter(d => !isNaN(d))
        .sort((a, b) => a - b);
    
    if (dates.length === 0) {
        containerEl.innerHTML = '<p style="color: #888; text-align: center;">No valid dates found.</p>';
        return;
    }
    
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);
    
    // Generate all dates in range
    const allDates = [];
    const current = new Date(firstDate);
    while (current <= lastDate) {
        allDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    
    // Get first day of week for alignment
    const firstDayOfWeek = firstDate.getDay();
    
    // Add empty cells before first date
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'song-calendar-day song-calendar-day-empty';
        containerEl.appendChild(emptyCell);
    }
    
    // Add day cells
    allDates.forEach(date => {
        const dateStr = date.toLocaleDateString('en-US');
        const plays = datePlayCount[dateStr] || 0;
        
        const dayCell = document.createElement('div');
        dayCell.className = 'song-calendar-day';
        dayCell.dataset.date = dateStr;
        dayCell.dataset.plays = plays;
        dayCell.textContent = date.getDate();
        
        if (plays > 0) {
            const intensity = plays / maxPlays;
            const green = Math.floor(50 + intensity * 150);
            dayCell.style.backgroundColor = `rgb(0, ${green}, 0)`;
        } else {
            dayCell.style.backgroundColor = '#222';
        }
        
        // Add tooltip
        dayCell.addEventListener('mouseenter', (e) => {
            const tooltip = document.getElementById('tooltip');
            const dateStr = e.currentTarget.dataset.date;
            const plays = parseInt(e.currentTarget.dataset.plays);
            tooltip.textContent = `${dateStr}: ${plays} ${plays === 1 ? 'play' : 'plays'}`;
            tooltip.style.opacity = '1';
        });
        
        dayCell.addEventListener('mousemove', (e) => {
            const tooltip = document.getElementById('tooltip');
            const offset = 12;
            tooltip.style.left = (e.clientX + offset) + 'px';
            tooltip.style.top = (e.clientY + offset) + 'px';
        });
        
        dayCell.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.opacity = '0';
        });
        
        containerEl.appendChild(dayCell);
    });
}

// Helper: Search for artist, song, or album
function searchData(data, query) {
    const lowerQuery = query.toLowerCase();
    
    const results = {
        artists: [],
        songs: [],
        albums: [],
        genres: []
    };
    
    data.forEach(item => {
        const artist = (item["Artist"] || "").toLowerCase();
        const songName = (item["Name"] || "").toLowerCase();
        const album = (item["Album"] || "").toLowerCase();
        const genresRaw = (item["Genres"] || "").toLowerCase();
        const genresList = genresRaw ? genresRaw.split(',').map(g => g.trim()).filter(Boolean) : [];
        
        if (artist.includes(lowerQuery) && !results.artists.find(r => r.name === item["Artist"])) {
            results.artists.push({
                name: item["Artist"],
                plays: 0,
                totalTime: 0
            });
        }
        
        if (songName.includes(lowerQuery) && !results.songs.find(r => r.name === item["Name"])) {
            results.songs.push({
                name: item["Name"],
                plays: 0,
                totalTime: 0
            });
        }
        
        if (album.includes(lowerQuery) && !results.albums.find(r => r.name === item["Album"])) {
            results.albums.push({
                name: item["Album"],
                plays: 0,
                totalTime: 0
            });
        }

        genresList.forEach(g => {
            if (g.includes(lowerQuery) && !results.genres.find(r => r.name.toLowerCase() === g)) {
                results.genres.push({
                    name: item["Genres"] || g,
                    plays: 0,
                    totalTime: 0
                });
            }
        });
    });
    
    // Count plays and time for each match
    data.forEach(item => {
        const duration = parseInt(item["Duration"]) || 0;
        const genresRaw = (item["Genres"] || "").trim();
        const genresList = genresRaw ? genresRaw.split(',').map(g => g.trim()) : [];
        
        results.artists.forEach(artist => {
            if (item["Artist"] === artist.name) {
                artist.plays++;
                artist.totalTime += duration;
            }
        });
        
        results.songs.forEach(song => {
            if (item["Name"] === song.name) {
                song.plays++;
                song.totalTime += duration;
            }
        });
        
        results.albums.forEach(album => {
            if (item["Album"] === album.name) {
                album.plays++;
                album.totalTime += duration;
            }
        });

        results.genres.forEach(genre => {
            // match genre if any of the item's genres equals the stored genre name (case-insensitive)
            const match = genresList.some(g => g.toLowerCase() === genre.name.toLowerCase());
            if (match) {
                genre.plays++;
                genre.totalTime += duration;
            }
        });
    });
    
    // Sort by plays
    results.artists.sort((a, b) => b.plays - a.plays);
    results.songs.sort((a, b) => b.plays - a.plays);
    results.albums.sort((a, b) => b.plays - a.plays);
    results.genres.sort((a, b) => b.plays - a.plays);
    
    return results;
}

// Helper: Retrieve full artist stats (used for modals) with caching
function getArtistDataByName(name) {
    if (window.artistStatsMap && window.artistStatsMap.has(name)) {
        return window.artistStatsMap.get(name);
    }
    if (!window.allData) return null;

    const stats = computeArtistStats(window.allData);
    window.artistStats = stats;
    window.artistStatsMap = new Map(stats.map(a => [a.name, a]));

    return window.artistStatsMap.get(name) || null;
}

// Helper: Retrieve full album stats (used for modals) with caching
function getAlbumDataByName(name) {
    if (window.albumStatsMap && window.albumStatsMap.has(name)) {
        return window.albumStatsMap.get(name);
    }
    if (!window.allData) return null;

    const stats = computeAlbumStats(window.allData);
    window.albumStats = stats;
    window.albumStatsMap = new Map(stats.map(a => [a.name, a]));

    return window.albumStatsMap.get(name) || null;
}

// Helper: Retrieve full genre stats (used for modals) with caching
function getGenreDataByName(name) {
    if (window.genreStatsMap && window.genreStatsMap.has(name)) {
        return window.genreStatsMap.get(name);
    }
    if (!window.allData) return null;

    const stats = computeGenreStats(window.allData);
    window.genreStats = stats;
    window.genreStatsMap = new Map(stats.map(g => [g.name, g]));

    return window.genreStatsMap.get(name) || null;
}

// Helper: Calculate days since first listen
function getDaysSinceFirstListen(data) {
    let earliestDate = null;
    
    data.forEach(item => {
        const ts = item["Timestamp"] || item["End Time"] || "";
        if (!ts) return;

        const date = new Date(ts);
        if (isNaN(date)) return;

        if (!earliestDate || date < earliestDate) {
            earliestDate = date;
        }
    });
    
    if (!earliestDate) return 1;
    
    const today = new Date();
    const diffTime = Math.abs(today - earliestDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
}

function renderSearchResults(results, query, activeFilters = null) {
    const filters = activeFilters || window.searchTypeFilters || { Artist: true, Song: true, Album: true, Genre: true };
    
    const totalPlays = 
        (filters.Artist ? results.artists.reduce((a, b) => a + b.plays, 0) : 0) +
        (filters.Song ? results.songs.reduce((a, b) => a + b.plays, 0) : 0) +
        (filters.Album ? results.albums.reduce((a, b) => a + b.plays, 0) : 0) +
        (filters.Genre ? results.genres.reduce((a, b) => a + b.plays, 0) : 0);
    
    const totalMs = 
        (filters.Artist ? results.artists.reduce((a, b) => a + b.totalTime, 0) : 0) +
        (filters.Song ? results.songs.reduce((a, b) => a + b.totalTime, 0) : 0) +
        (filters.Album ? results.albums.reduce((a, b) => a + b.totalTime, 0) : 0) +
        (filters.Genre ? results.genres.reduce((a, b) => a + b.totalTime, 0) : 0);
    
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const daysSinceFirst = getDaysSinceFirstListen(window.allData);
    const avgPerDay = (totalPlays / daysSinceFirst).toFixed(1);
    
    document.getElementById("searchPlays").textContent = totalPlays;
    document.getElementById("searchTime").textContent = `${hours}h ${minutes}m`;
    document.getElementById("searchAvgPerDay").textContent = avgPerDay;
    
    const searchResults = document.getElementById("searchResults");
    searchResults.style.display = totalPlays > 0 ? "grid" : "none";
    
    // Render match results
    const matchResults = document.getElementById("searchMatchResults");
    matchResults.innerHTML = "";
    
    const allMatches = [];
    
    if (filters.Artist) {
        results.artists.forEach(artist => {
            allMatches.push({
                type: "Artist",
                name: artist.name,
                plays: artist.plays,
                time: artist.totalTime
            });
        });
    }
    
    if (filters.Song) {
        results.songs.forEach(song => {
            allMatches.push({
                type: "Song",
                name: song.name,
                plays: song.plays,
                time: song.totalTime
            });
        });
    }
    
    if (filters.Album) {
        results.albums.forEach(album => {
            allMatches.push({
                type: "Album",
                name: album.name,
                plays: album.plays,
                time: album.totalTime
            });
        });
    }

    if (filters.Genre) {
        results.genres.forEach(genre => {
            allMatches.push({
                type: "Genre",
                name: genre.name,
                plays: genre.plays,
                time: genre.totalTime
            });
        });
    }
    
    allMatches.sort((a, b) => b.plays - a.plays);
    
    if (allMatches.length === 0) {
        matchResults.innerHTML = "<p style='color: #888; text-align: center;'>No results found for \"" + query + "\"</p>";
    } else {
        allMatches.forEach(match => {
            const timeHours = Math.floor(match.time / (1000 * 60 * 60));
            const timeMinutes = Math.floor((match.time % (1000 * 60 * 60)) / (1000 * 60));
            const timeStr = timeHours > 0 ? `${timeHours}h ${timeMinutes}m` : `${timeMinutes}m`;
            
            const matchEl = document.createElement("div");
            matchEl.className = "search-match-item";
            matchEl.innerHTML = `
                <div class="match-type">${match.type}</div>
                <div class="match-name">${match.name}</div>
                <div class="match-details">
                    <div class="match-detail">
                        <strong>${match.plays}</strong>
                        Plays
                    </div>
                    <div class="match-detail">
                        <strong>${timeStr}</strong>
                        Time
                    </div>
                </div>
            `;
            // Allow clicking songs, artists, albums, or genres to see detailed stats
            if (match.type === "Song" || match.type === "Artist" || match.type === "Album" || match.type === "Genre") {
                matchEl.style.cursor = "pointer";
                matchEl.setAttribute("role", "button");
                matchEl.setAttribute("tabindex", "0");
                const open = () => {
                    if (match.type === "Song") {
                        openSongModal(match.name);
                    } else if (match.type === "Artist") {
                        const artistData = getArtistDataByName(match.name);
                        if (artistData) {
                            openArtistModal(artistData);
                        } else {
                            console.warn('Artist data unavailable for', match.name);
                        }
                    } else if (match.type === "Album") {
                        const albumData = getAlbumDataByName(match.name);
                        if (albumData) {
                            openAlbumModal(albumData);
                        } else {
                            console.warn('Album data unavailable for', match.name);
                        }
                    } else {
                        const genreData = getGenreDataByName(match.name);
                        if (genreData) {
                            openGenreModal(genreData);
                        } else {
                            console.warn('Genre data unavailable for', match.name);
                        }
                    }
                };
                matchEl.addEventListener("click", open);
                matchEl.addEventListener("keypress", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        open();
                    }
                });
            }
            matchResults.appendChild(matchEl);
        });
    }
}

// Helper: Filter data for today only
function getTodayData(data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return data.filter(item => {
        const ts = item["Timestamp"] || item["End Time"] || "";
        if (!ts) return false;

        const date = new Date(ts);
        if (isNaN(date)) return false;

        const itemDate = new Date(date);
        itemDate.setHours(0, 0, 0, 0);
        
        return itemDate.getTime() === today.getTime();
    });
}

// Helper: Filter data for this week (last 7 days including today)
function getWeeklyData(data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    
    return data.filter(item => {
        const ts = item["Timestamp"] || item["End Time"] || "";
        if (!ts) return false;

        const date = new Date(ts);
        if (isNaN(date)) return false;

        const itemDate = new Date(date);
        itemDate.setHours(0, 0, 0, 0);
        
        return itemDate.getTime() >= sevenDaysAgo.getTime() && itemDate.getTime() <= today.getTime();
    });
}

// Helper: Filter data for this month
function getMonthlyData(data) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return data.filter(item => {
        const ts = item["Timestamp"] || item["End Time"] || "";
        if (!ts) return false;

        const date = new Date(ts);
        if (isNaN(date)) return false;

        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
}

// Helper: Render period statistics
function renderPeriodStats(periodData, period, customLabel = null) {
    // Calculate period totals
    const periodTracks = periodData.length;
    const periodMs = periodData.reduce((acc, item) => {
        return acc + (parseInt(item["Duration"]) || 0);
    }, 0);
    const periodHours = Math.floor(periodMs / (1000 * 60 * 60));
    const periodMinutes = Math.floor((periodMs % (1000 * 60 * 60)) / (1000 * 60));

    // Update stat boxes
    document.getElementById("periodTotalTracks").textContent = periodTracks;
    document.getElementById("periodListeningTime").textContent = `${periodHours}h ${periodMinutes}m`;

    // Update section titles
    let periodLabel;
    if (customLabel) {
        periodLabel = customLabel;
    } else {
        periodLabel = period === 'today' ? "Today's" : period === 'weekly' ? "This Week's" : "This Month's";
    }
    document.getElementById("period-summary-title").textContent = `${periodLabel} Stats`;
    document.getElementById("periodSongs-title").textContent = `${periodLabel} Songs`;
    document.getElementById("periodArtists-title").textContent = `${periodLabel} Artists`;
    document.getElementById("periodAlbums-title").textContent = `${periodLabel} Albums`;

    // Get frequency data
    const periodSongs = countFrequency(periodData, "Name");
    const periodArtists = countFrequency(periodData, "Artist");
    const periodAlbums = countFrequency(periodData, "Album");

    // Get top artist and album
    const topArtist = periodArtists.length > 0 ? periodArtists[0][0] : "N/A";
    const topAlbum = periodAlbums.length > 0 ? periodAlbums[0][0] : "N/A";

    // Update top artist and album
    document.getElementById("periodTopArtist").textContent = topArtist;
    document.getElementById("periodTopAlbum").textContent = topAlbum;

    // Set album cover as background for top album box if available
    if (topAlbum !== "N/A") {
        const albumRecord = periodData.find(item => item["Album"] === topAlbum);
        if (albumRecord && albumRecord["Cover Image"]) {
            const albumBox = document.getElementById("periodTopAlbumBox");
            albumBox.style.backgroundImage = `url('${albumRecord["Cover Image"]}')`;
            albumBox.style.backgroundSize = "cover";
            albumBox.style.backgroundPosition = "center";
            // Add overlay to ensure text is readable
            albumBox.style.position = "relative";
            // Dark overlay effect - add a semi-transparent dark overlay
            if (!albumBox.querySelector(".album-overlay")) {
                const overlay = document.createElement("div");
                overlay.className = "album-overlay";
                overlay.style.position = "absolute";
                overlay.style.top = "0";
                overlay.style.left = "0";
                overlay.style.right = "0";
                overlay.style.bottom = "0";
                overlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
                overlay.style.borderRadius = "10px";
                overlay.style.zIndex = "0";
                albumBox.insertBefore(overlay, albumBox.firstChild);
                // Ensure text is above overlay
                Array.from(albumBox.children).slice(1).forEach(child => {
                    if (child !== overlay) child.style.position = "relative";
                    if (child !== overlay) child.style.zIndex = "1";
                });
            }
        }
    }

    // Render songs list
    const songsList = document.getElementById("periodSongsList");
    songsList.innerHTML = "";
    const visibleSongs = periodSongs.slice(0, 10);
    const hiddenSongs = periodSongs.slice(10);
    
    visibleSongs.forEach(([name, count]) => {
        const li = document.createElement("li");
        li.classList.add("clickable-song");
        li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
        li.addEventListener("click", () => openSongModal(name));
        songsList.appendChild(li);
    });
    
    if (hiddenSongs.length > 0) {
        const showMoreBtn = document.createElement("button");
        showMoreBtn.className = "show-more-btn";
        showMoreBtn.textContent = `Show ${hiddenSongs.length} more songs`;
        showMoreBtn.addEventListener("click", () => {
            showMoreBtn.style.display = "none";
            hiddenSongs.forEach(([name, count]) => {
                const li = document.createElement("li");
                li.classList.add("clickable-song");
                li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
                li.addEventListener("click", () => openSongModal(name));
                songsList.appendChild(li);
            });
        });
        songsList.appendChild(showMoreBtn);
    }

    // Render artists list
    const artistsList = document.getElementById("periodArtistsList");
    artistsList.innerHTML = "";
    const visibleArtists = periodArtists.slice(0, 10);
    const hiddenArtists = periodArtists.slice(10);
    
    visibleArtists.forEach(([name, count]) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
        artistsList.appendChild(li);
    });
    
    if (hiddenArtists.length > 0) {
        const showMoreBtn = document.createElement("button");
        showMoreBtn.className = "show-more-btn";
        showMoreBtn.textContent = `Show ${hiddenArtists.length} more artists`;
        showMoreBtn.addEventListener("click", () => {
            showMoreBtn.style.display = "none";
            hiddenArtists.forEach(([name, count]) => {
                const li = document.createElement("li");
                li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
                artistsList.appendChild(li);
            });
        });
        artistsList.appendChild(showMoreBtn);
    }

    // Render albums list
    const albumsList = document.getElementById("periodAlbumsList");
    albumsList.innerHTML = "";
    const visibleAlbums = periodAlbums.slice(0, 10);
    const hiddenAlbums = periodAlbums.slice(10);
    
    visibleAlbums.forEach(([name, count]) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
        albumsList.appendChild(li);
    });
    
    if (hiddenAlbums.length > 0) {
        const showMoreBtn = document.createElement("button");
        showMoreBtn.className = "show-more-btn";
        showMoreBtn.textContent = `Show ${hiddenAlbums.length} more albums`;
        showMoreBtn.addEventListener("click", () => {
            showMoreBtn.style.display = "none";
            hiddenAlbums.forEach(([name, count]) => {
                const li = document.createElement("li");
                li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
                albumsList.appendChild(li);
            });
        });
        albumsList.appendChild(showMoreBtn);
    }

    // Calculate and render genre breakdown for period
    const periodGenres = countFrequency(periodData, "Genres");
    // Expand genres since they're comma-separated
    const expandedGenres = {};
    periodData.forEach(item => {
        const genreString = item["Genres"] || "";
        const genres = genreString.split(",").map(g => g.trim()).filter(g => g);
        genres.forEach(genre => {
            expandedGenres[genre] = (expandedGenres[genre] || 0) + 1;
        });
    });
    const genreArray = Object.entries(expandedGenres)
        .map(([genre, count]) => [genre, count])
        .sort((a, b) => b[1] - a[1]);
    
    renderPeriodGenreChart(genreArray);
}

async function loadData() {
    try {
        const res = await fetch(SHEET_URL);
        const csv = await res.text();
        const data = parseCSV(csv);

        // --- Stats Calculations ---
        
        // 1. Total Tracks
        const totalTracks = data.length;

        // 2. Total Listening Time (assumes "Duration" column in ms)
        const totalMs = data.reduce((acc, item) => {
            return acc + (parseInt(item["Duration"]) || 0);
        }, 0);
        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

        // 3. Top Favorites
        const topArtists = countFrequency(data, "Artist");
        const topAlbums = countFrequency(data, "Album");
        // Genres is a list column, so we pass true
        // NOTE: Ensure your sheet header is exactly "Genres" (case sensitive)
        const topGenres = countFrequency(data, "Genres", true);

        // --- Update DOM for All Time Stats ---
        document.getElementById("totalTracks").textContent = totalTracks;
        document.getElementById("listeningTime").textContent = `${hours}h ${minutes}m`;
        document.getElementById("topArtist").textContent = topArtists[0]?.[0] || "N/A";
        // document.getElementById("topGenre").textContent = topGenres[0]?.[0] || "N/A";

        // Top Album: display name and, if available, use album cover image as background
        const topAlbumName = topAlbums[0]?.[0] || "N/A";
        const topAlbumEl = document.getElementById("topAlbum");
        topAlbumEl.textContent = topAlbumName;

        // Find a cover image URL from a row that matches the top album
        let coverUrl = null;
        if (topAlbumName !== "N/A") {
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row) continue;
                // Match album name exactly
                if ((row["Album"] || '') === topAlbumName) {
                    const candidate = (row["Cover Image"] || row["Cover"] || '').trim();
                    if (candidate) { coverUrl = candidate; break; }
                }
            }
        }

        // Apply as background on the parent stat-box for a nicer visual
        const topAlbumBox = topAlbumEl.closest('.stat-box');
        if (topAlbumBox) {
            if (coverUrl) {
                // Use a subtle dark gradient overlay to keep text readable
                topAlbumBox.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.70), rgba(0,0,0,0.70)), url('${coverUrl}')`;
                topAlbumBox.style.backgroundSize = 'cover';
                topAlbumBox.style.backgroundPosition = 'center';
                topAlbumBox.style.color = '#fff';
            } else {
                // Clear any previous inline background if no cover found
                topAlbumBox.style.backgroundImage = '';
                topAlbumBox.style.backgroundSize = '';
                topAlbumBox.style.backgroundPosition = '';
            }
        }

        // --- Render Genre Chart ---
        renderGenreChart(topGenres);
        renderGenreTrendsChart(data);
        renderCalendarHeatmap(data);
        renderHeatmap(data);
        renderListeningStreak(data);
        renderCollaborationNetwork(data);

        // --- Period Data (Today by default) ---
        const todayData = getTodayData(data);
        renderPeriodStats(todayData, 'today');
        
        // Store data globally for period switching
        window.allData = data;
        window.currentCalendarYear = new Date().getFullYear();
        window.currentCalendarMonth = new Date().getMonth();

        // Compute and render top-10 artist cards
        try {
            const artistStats = computeArtistStats(window.allData);
            window.artistStats = artistStats;
            window.artistStatsMap = new Map(artistStats.map(a => [a.name, a]));
            renderArtistCards(artistStats.slice(0, 10));
        } catch (err) {
            console.warn('Artist cards render failed:', err);
        }

        // Compute album stats cache for search modal usage
        try {
            const albumStats = computeAlbumStats(window.allData);
            window.albumStats = albumStats;
            window.albumStatsMap = new Map(albumStats.map(a => [a.name, a]));
        } catch (err) {
            console.warn('Album stats cache failed:', err);
        }

        // Compute genre stats cache for search modal usage
        try {
            const genreStats = computeGenreStats(window.allData);
            window.genreStats = genreStats;
            window.genreStatsMap = new Map(genreStats.map(g => [g.name, g]));
        } catch (err) {
            console.warn('Genre stats cache failed:', err);
        }

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function renderGenreChart(genresData) {
    const ctx = document.getElementById('genreChart').getContext('2d');
    
    // Take top 8 genres, group rest as "Other"
    const top8 = genresData.slice(0, 8);
    const othersCount = genresData.slice(8).reduce((sum, item) => sum + item[1], 0);

    const labels = top8.map(g => g[0]);
    const dataPoints = top8.map(g => g[1]);

    if (othersCount > 0) {
        labels.push("Other");
        dataPoints.push(othersCount);
    }

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataPoints,
                backgroundColor: [
                    '#1db954', // Spotify Green
                    '#1ed760',
                    '#2ac769',
                    '#36b772',
                    '#42a77b',
                    '#4e9784',
                    '#5a878d',
                    '#667796',
                    '#333333'  // Dark Grey for others
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        padding: 20,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function renderPeriodGenreChart(genresData) {
    const ctx = document.getElementById('periodGenreChart');
    if (!ctx) return; // Chart element doesn't exist
    
    const canvasCtx = ctx.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.periodGenreChartInstance) {
        window.periodGenreChartInstance.destroy();
    }
    
    // Take top 8 genres, group rest as "Other"
    const top8 = genresData.slice(0, 8);
    const othersCount = genresData.slice(8).reduce((sum, item) => sum + item[1], 0);

    const labels = top8.map(g => g[0]);
    const dataPoints = top8.map(g => g[1]);

    if (othersCount > 0) {
        labels.push("Other");
        dataPoints.push(othersCount);
    }

    window.periodGenreChartInstance = new Chart(canvasCtx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataPoints,
                backgroundColor: [
                    '#1db954', // Spotify Green
                    '#1ed760',
                    '#2ac769',
                    '#36b772',
                    '#42a77b',
                    '#4e9784',
                    '#5a878d',
                    '#667796',
                    '#333333'  // Dark Grey for others
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        padding: 20,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function renderHeatmap(data) {
  const heatmap = document.getElementById("heatmapGrid");
  heatmap.innerHTML = "";

  // Track both play counts AND total stream time
  const hourData = Array.from({ length: 24 }, () => ({
    plays: 0,
    minutes: 0
  }));
  console.log(data);  

  data.forEach(item => {
    const ts = item["Timestamp"] || item["End Time"] || "";
    if (!ts) return;

    const date = new Date(ts);
    if (isNaN(date)) return;

    const hour = date.getHours();
    hourData[hour].plays++;

    const duration = Number(item["Duration"]) || 0;
    hourData[hour].minutes += (duration) / (1000 * 60); // convert ms to minutes
  });

  const maxCount = Math.max(...hourData.map(h => h.plays));

  hourData.forEach((entry, hour) => {
    const cellContainer = document.createElement("div");
    cellContainer.className = "cell-container";

    const cell = document.createElement("div");
    cell.className = "heat-cell";

    const intensity = maxCount === 0 ? 0 : entry.plays / maxCount;
    const green = Math.floor(50 + intensity * 150);
    cell.style.backgroundColor = `rgb(0, ${green}, 0)`;

        // Store data for tooltip and attach custom mouse handlers
        cell.dataset.hour = hour;
        cell.dataset.plays = entry.plays;
        cell.dataset.minutes = entry.minutes;

        const tooltip = document.getElementById('tooltip');

        function formatMinutes(mins) {
            const h = Math.floor(mins / 60);
            const m = Math.round(mins % 60);
            return h > 0 ? `${h}h ${m}m` : `${m} min`;
        }

        cell.addEventListener('mouseenter', (e) => {
            const plays = e.currentTarget.dataset.plays || 0;
            const minutes = Number(e.currentTarget.dataset.minutes) || 0;
            // tooltip.textContent = `${hour}:00 — Plays: ${plays}, Stream time: ${formatMinutes(minutes)}`;
            tooltip.textContent = `Plays: ${plays}, Stream time: ${formatMinutes(minutes)}`;
            tooltip.style.opacity = '1';
        });

        cell.addEventListener('mousemove', (e) => {
            const offset = 12;
            tooltip.style.left = (e.clientX + offset) + 'px';
            tooltip.style.top = (e.clientY + offset) + 'px';
        });

        cell.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });

    // Hour label
    const label = document.createElement("div");
    label.className = "hour-label";
    label.textContent = `${hour}:00`;

    cellContainer.appendChild(cell);
    cellContainer.appendChild(label);

    heatmap.appendChild(cellContainer);
  });
}

// Helper: Get genre trends for the last 30 days
function getGenreTrendsData(data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    
    // Initialize dates for last 30 days
    const dateMap = new Map();
    for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateMap.set(dateStr, new Map());
    }
    
    // Populate with genre data
    data.forEach(item => {
        const ts = item["Timestamp"] || item["End Time"] || "";
        if (!ts) return;

        const date = new Date(ts);
        if (isNaN(date)) return;

        const itemDate = new Date(date);
        itemDate.setHours(0, 0, 0, 0);
        
        if (itemDate.getTime() >= thirtyDaysAgo.getTime() && itemDate.getTime() <= today.getTime()) {
            const dateStr = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const genres = (item["Genres"] || "").split(",").map(g => g.trim()).filter(g => g);
            const genreMap = dateMap.get(dateStr);
            
            genres.forEach(genre => {
                genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
            });
        }
    });
    
    return dateMap;
}

function renderGenreTrendsChart(data) {
    const genreTrends = getGenreTrendsData(data);
    const dates = Array.from(genreTrends.keys());
    
    // Get all unique genres
    const allGenres = new Set();
    genreTrends.forEach(genreMap => {
        genreMap.forEach((_, genre) => allGenres.add(genre));
    });
    
    // Take top 5 genres by total count
    const genreCountMap = new Map();
    genreTrends.forEach(genreMap => {
        genreMap.forEach((count, genre) => {
            genreCountMap.set(genre, (genreCountMap.get(genre) || 0) + count);
        });
    });
    
    const top5Genres = [...genreCountMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0]);
    
    // Build datasets
    const datasets = top5Genres.map((genre, index) => {
        const colors = [
            '#1db954',
            '#1ed760',
            '#2ac769',
            '#36b772',
            '#42a77b'
        ];
        
        return {
            label: genre,
            data: dates.map(date => genreTrends.get(date).get(genre) || 0),
            borderColor: colors[index],
            backgroundColor: colors[index] + '40',
            borderWidth: 2,
            fill: true,
            tension: 0.3
        };
    });
    
    const ctx = document.getElementById('genreTrendsChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        padding: 20,
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#b3b3b3'
                    },
                    grid: {
                        color: '#333'
                    }
                },
                x: {
                    ticks: {
                        color: '#b3b3b3'
                    },
                    grid: {
                        color: '#333'
                    }
                }
            }
        }
    });
}

// Helper: Calculate listening streaks
function calculateListeningStreaks(data) {
    // Get all unique dates with listening activity
    const listeningDates = new Set();
    
    data.forEach(item => {
        const ts = item["Timestamp"] || item["End Time"] || "";
        if (!ts) return;

        const date = new Date(ts);
        if (isNaN(date)) return;

        const dateStr = date.toLocaleDateString('en-US');
        listeningDates.add(dateStr);
    });
    
    // Sort dates
    const sortedDates = Array.from(listeningDates)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a - b);
    
    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let longestStreakStart = null;
    let currentStreakStart = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let lastDate = null;
    
    sortedDates.forEach((date, index) => {
        if (lastDate === null) {
            currentStreak = 1;
            currentStreakStart = date;
        } else {
            const dayDiff = Math.floor((date - lastDate) / (1000 * 60 * 60 * 24));
            
            if (dayDiff === 1) {
                // Consecutive day
                currentStreak++;
            } else {
                // Streak broken
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                    longestStreakStart = currentStreakStart;
                }
                currentStreak = 1;
                currentStreakStart = date;
            }
        }
        
        lastDate = date;
    });
    
    // Check if last streak is the longest
    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakStart = currentStreakStart;
    }
    
    // Determine if current streak is active (includes today or yesterday)
    let activeCurrentStreak = 0;
    let activeCurrentStreakStart = null;
    
    if (sortedDates.length > 0) {
        const lastListenDate = new Date(sortedDates[sortedDates.length - 1]);
        lastListenDate.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastListenDate.getTime() === today.getTime() || lastListenDate.getTime() === yesterday.getTime()) {
            activeCurrentStreak = currentStreak;
            activeCurrentStreakStart = currentStreakStart;
        }
    }
    
    return {
        currentStreak: activeCurrentStreak,
        currentStreakStart: activeCurrentStreakStart,
        longestStreak: longestStreak,
        longestStreakStart: longestStreakStart
    };
}

function renderListeningStreak(data) {
    const streaks = calculateListeningStreaks(data);
    
    document.getElementById("currentStreak").textContent = streaks.currentStreak;
    document.getElementById("longestStreak").textContent = streaks.longestStreak;
    
    if (streaks.currentStreakStart) {
        const startDate = new Date(streaks.currentStreakStart);
        const endDate = new Date();
        const dateRange = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        document.getElementById("currentStreakDate").textContent = `Started ${dateRange}`;
    } else {
        document.getElementById("currentStreakDate").textContent = "No active streak";
    }
    
    if (streaks.longestStreakStart) {
        const startDate = new Date(streaks.longestStreakStart);
        const dateRange = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        document.getElementById("longestStreakDate").textContent = `From ${dateRange}`;
    } else {
        document.getElementById("longestStreakDate").textContent = "N/A";
    }
}


loadData();

// Tab switching functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Mark button as active
        e.target.classList.add('active');
        
        // Re-render collaboration network if switching to that tab
        if (tabName === 'collab-network' && window.allData) {
            renderCollaborationNetwork(window.allData);
        }
    });
});

// Helper: Filter data for a custom date range
function getCustomRangeData(data, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // include the entire end day
    end.setHours(23,59,59,999);

    return data.filter(item => {
        const ts = item["Timestamp"] || item["End Time"] || "";
        if (!ts) return false;
        const d = new Date(ts);
        if (isNaN(d)) return false;
        return d >= start && d <= end;
    });
}

// Helper: Render daily heatmap for a specific album
function renderAlbumDailyHeatmap(data, albumName, containerEl) {
    if (!containerEl) return;
    
    // Filter data for this album
    const albumData = data.filter(item => item["Album"] === albumName);
    if (albumData.length === 0) {
        containerEl.innerHTML = '<p style="color: #888; text-align: center;">No listening data for this album.</p>';
        return;
    }
    
    // Build date-based play count map
    const datePlayCount = {};
    albumData.forEach(item => {
        const timestamp = item["Timestamp"] || item["End Time"] || "";
        if (!timestamp) return;
        const date = new Date(timestamp);
        if (isNaN(date)) return;
        const dateStr = date.toLocaleDateString('en-US');
        datePlayCount[dateStr] = (datePlayCount[dateStr] || 0) + 1;
    });
    
    const maxPlays = Math.max(...Object.values(datePlayCount), 1);
    
    containerEl.innerHTML = '';
    
    // Add day labels (Sun-Sat)
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(label => {
        const labelEl = document.createElement('div');
        labelEl.className = 'song-calendar-day-label';
        labelEl.textContent = label;
        containerEl.appendChild(labelEl);
    });
    
    // Get date range from album data
    const dates = albumData
        .map(item => new Date(item["Timestamp"] || item["End Time"] || ""))
        .filter(d => !isNaN(d))
        .sort((a, b) => a - b);
    
    if (dates.length === 0) {
        containerEl.innerHTML = '<p style="color: #888; text-align: center;">No valid dates found.</p>';
        return;
    }
    
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);
    
    // Generate all dates in range
    const allDates = [];
    const current = new Date(firstDate);
    while (current <= lastDate) {
        allDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    
    // Get first day of week for alignment
    const firstDayOfWeek = firstDate.getDay();
    
    // Add empty cells before first date
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'song-calendar-day song-calendar-day-empty';
        containerEl.appendChild(emptyCell);
    }
    
    // Add day cells
    allDates.forEach(date => {
        const dateStr = date.toLocaleDateString('en-US');
        const plays = datePlayCount[dateStr] || 0;
        
        const dayCell = document.createElement('div');
        dayCell.className = 'song-calendar-day';
        dayCell.dataset.date = dateStr;
        dayCell.dataset.plays = plays;
        dayCell.textContent = date.getDate();
        
        if (plays > 0) {
            const intensity = plays / maxPlays;
            const green = Math.floor(50 + intensity * 150);
            dayCell.style.backgroundColor = `rgb(0, ${green}, 0)`;
        } else {
            dayCell.style.backgroundColor = '#222';
        }
        
        // Add tooltip
        dayCell.addEventListener('mouseenter', (e) => {
            const tooltip = document.getElementById('tooltip');
            const dateStr = e.currentTarget.dataset.date;
            const plays = parseInt(e.currentTarget.dataset.plays);
            tooltip.textContent = `${dateStr}: ${plays} ${plays === 1 ? 'play' : 'plays'}`;
            tooltip.style.opacity = '1';
        });
        
        dayCell.addEventListener('mousemove', (e) => {
            const tooltip = document.getElementById('tooltip');
            const offset = 12;
            tooltip.style.left = (e.clientX + offset) + 'px';
            tooltip.style.top = (e.clientY + offset) + 'px';
        });
        
        dayCell.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.opacity = '0';
        });
        
        containerEl.appendChild(dayCell);
        });
    }

    // Period switching functionality (for Today/Weekly/Monthly stats)
document.querySelectorAll('.period-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const period = e.target.dataset.period;
        let filteredData;
        
        // Show/hide custom range section
        const customSection = document.getElementById('customRangeSection');
        if (period === 'custom') {
            customSection.style.display = 'block';
            return; // Don't render yet, wait for user to apply dates
        } else {
            customSection.style.display = 'none';
        }
        
        // Filter data based on selected period
        if (period === 'today') {
            filteredData = getTodayData(window.allData);
        } else if (period === 'weekly') {
            filteredData = getWeeklyData(window.allData);
        } else if (period === 'monthly') {
            filteredData = getMonthlyData(window.allData);
        }
        
        // Remove active class from all period buttons
        document.querySelectorAll('.period-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mark selected button as active
        e.target.classList.add('active');
        
        // Render stats for selected period
        renderPeriodStats(filteredData, period);
    });
});

// Custom date range handler
document.getElementById('applyRangeBtn').addEventListener('click', () => {
    const startDateInput = document.getElementById('rangeStartDate').value;
    const endDateInput = document.getElementById('rangeEndDate').value;
    
    if (!startDateInput || !endDateInput) {
        alert('Please select both start and end dates.');
        return;
    }
    
    const start = new Date(startDateInput);
    const end = new Date(endDateInput);
    
    if (start > end) {
        alert('Start date must be before end date.');
        return;
    }
    
    // Filter data by custom range
    const filteredData = getCustomRangeData(window.allData, startDateInput, endDateInput);
    
    // Update active button
    document.querySelectorAll('.period-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-period="custom"]').classList.add('active');
    
    // Format period label
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const customLabel = `${startStr} to ${endStr}`;
    
    // Render with custom label
    renderPeriodStats(filteredData, 'custom', customLabel);
});

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    window.lastSearchQuery = query;
    
    if (query.length === 0) {
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('searchMatchResults').innerHTML = '';
        window.lastSearchResults = null;
    } else {
        const results = searchData(window.allData, query);
        window.lastSearchResults = results;
        renderSearchResults(results, query, window.searchTypeFilters);
    }
});

// Search filters (artist/song/album/genre) via chips
window.searchTypeFilters = { Artist: true, Song: true, Album: true, Genre: true };
window.lastSearchResults = null;
window.lastSearchQuery = '';

const filterChips = document.querySelectorAll('#searchFilterGroup .filter-chip');
filterChips.forEach(chip => {
    const type = chip.dataset.type;
    if (!type) return;

    chip.addEventListener('click', () => {
        const nowActive = !chip.classList.contains('active');
        chip.classList.toggle('active', nowActive);
        window.searchTypeFilters[type] = nowActive;

        if (window.lastSearchResults && window.lastSearchQuery.length > 0) {
            renderSearchResults(window.lastSearchResults, window.lastSearchQuery, window.searchTypeFilters);
        }
    });
});

// Toggle dropdown for filters to reduce clutter
const filterToggle = document.getElementById('filterToggle');
const filterWrapper = document.querySelector('.search-filter-wrapper');
if (filterToggle && filterWrapper) {
    filterToggle.addEventListener('click', () => {
        const isOpen = filterWrapper.classList.toggle('open');
        filterToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
        if (!filterWrapper.contains(e.target)) {
            filterWrapper.classList.remove('open');
            filterToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Calendar month/year navigation
document.getElementById('prevYear').addEventListener('click', () => {
    window.currentCalendarMonth--;
    if (window.currentCalendarMonth < 0) {
        window.currentCalendarMonth = 11;
        window.currentCalendarYear--;
    }
    renderCalendarHeatmap(window.allData, window.currentCalendarYear, window.currentCalendarMonth);
});

document.getElementById('nextYear').addEventListener('click', () => {
    window.currentCalendarMonth++;
    if (window.currentCalendarMonth > 11) {
        window.currentCalendarMonth = 0;
        window.currentCalendarYear++;
    }
    renderCalendarHeatmap(window.allData, window.currentCalendarYear, window.currentCalendarMonth);
});

// Collaboration search functionality with autocomplete
const collabSearchInput = document.getElementById('collabSearchInput');
const collabDropdown = document.getElementById('collabDropdown');

collabSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    const dropdown = document.getElementById('collabDropdown');
    
    if (query.length === 0) {
        dropdown.style.display = 'none';
        document.getElementById('collaborationResults').innerHTML = '';
        return;
    }
    
    // Get all artists and filter by query
    const allArtists = getAllArtists(window.allData);
    const filteredArtists = allArtists.filter(artist => 
        artist.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filteredArtists.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    // Show dropdown with suggestions
    dropdown.innerHTML = '';
    dropdown.style.display = 'block';
    
    filteredArtists.forEach(artist => {
        const item = document.createElement('div');
        item.className = 'collab-dropdown-item';
        item.textContent = artist;
        item.addEventListener('click', () => {
            collabSearchInput.value = artist;
            dropdown.style.display = 'none';
            const results = findArtistCollaborations(window.allData, artist);
            renderCollaborationResults(results, artist);
        });
        dropdown.appendChild(item);
    });
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
    const container = document.querySelector('.collab-search-container');
    if (!container.contains(e.target)) {
        document.getElementById('collabDropdown').style.display = 'none';
    }
});

// Period Search functionality (for Listening Breakdown tab)
const periodSearchInput = document.getElementById('periodSearchInput');
if (periodSearchInput) {
    periodSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        window.lastPeriodSearchQuery = query;
        
        if (query.length === 0) {
            document.getElementById('periodSearchResults').style.display = 'none';
            document.getElementById('periodSearchMatchResults').innerHTML = '';
            window.lastPeriodSearchResults = null;
        } else {
            // Get current period data
            let periodData = window.allData;
            const activeButton = document.querySelector('.period-button.active');
            if (activeButton) {
                const period = activeButton.dataset.period;
                if (period === 'today') {
                    periodData = getTodayData(window.allData);
                } else if (period === 'weekly') {
                    periodData = getWeeklyData(window.allData);
                } else if (period === 'monthly') {
                    periodData = getMonthlyData(window.allData);
                } else if (period === 'custom') {
                    const startDate = document.getElementById('rangeStartDate').value;
                    const endDate = document.getElementById('rangeEndDate').value;
                    if (startDate && endDate) {
                        periodData = getCustomRangeData(window.allData, startDate, endDate);
                    }
                }
            }
            
            const results = searchData(periodData, query);
            window.lastPeriodSearchResults = results;
            renderPeriodSearchResults(results, query, window.periodSearchTypeFilters);
        }
    });
}

// Period Search filters
window.periodSearchTypeFilters = { Artist: true, Song: true, Album: true, Genre: true };
window.lastPeriodSearchResults = null;
window.lastPeriodSearchQuery = '';

const periodFilterChips = document.querySelectorAll('#periodSearchFilterGroup .filter-chip');
periodFilterChips.forEach(chip => {
    const type = chip.dataset.type;
    if (!type) return;

    chip.addEventListener('click', () => {
        const nowActive = !chip.classList.contains('active');
        chip.classList.toggle('active', nowActive);
        window.periodSearchTypeFilters[type] = nowActive;

        if (window.lastPeriodSearchResults && window.lastPeriodSearchQuery.length > 0) {
            renderPeriodSearchResults(window.lastPeriodSearchResults, window.lastPeriodSearchQuery, window.periodSearchTypeFilters);
        }
    });
});

// Toggle dropdown for period filters
const periodFilterToggle = document.getElementById('periodFilterToggle');
const periodFilterWrapper = document.querySelector('#periodSearchSection .search-filter-wrapper');
if (periodFilterToggle && periodFilterWrapper) {
    periodFilterToggle.addEventListener('click', () => {
        const isOpen = periodFilterWrapper.classList.toggle('open');
        periodFilterToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
        if (!periodFilterWrapper.contains(e.target)) {
            periodFilterWrapper.classList.remove('open');
            periodFilterToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Render period search results with same style as main search
function renderPeriodSearchResults(results, query, activeFilters = null) {
    const filters = activeFilters || window.periodSearchTypeFilters || { Artist: true, Song: true, Album: true, Genre: true };
    
    const totalPlays = 
        (filters.Artist ? results.artists.reduce((a, b) => a + b.plays, 0) : 0) +
        (filters.Song ? results.songs.reduce((a, b) => a + b.plays, 0) : 0) +
        (filters.Album ? results.albums.reduce((a, b) => a + b.plays, 0) : 0) +
        (filters.Genre ? results.genres.reduce((a, b) => a + b.plays, 0) : 0);
    
    const totalMs = 
        (filters.Artist ? results.artists.reduce((a, b) => a + b.totalTime, 0) : 0) +
        (filters.Song ? results.songs.reduce((a, b) => a + b.totalTime, 0) : 0) +
        (filters.Album ? results.albums.reduce((a, b) => a + b.totalTime, 0) : 0) +
        (filters.Genre ? results.genres.reduce((a, b) => a + b.totalTime, 0) : 0);
    
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Get days in current period for avg calculation
    let periodData = window.allData;
    const activeButton = document.querySelector('.period-button.active');
    if (activeButton) {
        const period = activeButton.dataset.period;
        if (period === 'today') {
            periodData = getTodayData(window.allData);
        } else if (period === 'weekly') {
            periodData = getWeeklyData(window.allData);
        } else if (period === 'monthly') {
            periodData = getMonthlyData(window.allData);
        } else if (period === 'custom') {
            const startDate = document.getElementById('rangeStartDate').value;
            const endDate = document.getElementById('rangeEndDate').value;
            if (startDate && endDate) {
                periodData = getCustomRangeData(window.allData, startDate, endDate);
            }
        }
    }
    
    const daysSinceFirst = getDaysSinceFirstListen(periodData);
    const avgPerDay = daysSinceFirst > 0 ? (totalPlays / daysSinceFirst).toFixed(1) : totalPlays;
    
    document.getElementById("periodSearchPlays").textContent = totalPlays;
    document.getElementById("periodSearchTime").textContent = `${hours}h ${minutes}m`;
    document.getElementById("periodSearchAvgPerDay").textContent = avgPerDay;
    
    const searchResults = document.getElementById("periodSearchResults");
    searchResults.style.display = totalPlays > 0 ? "grid" : "none";
    
    // Render match results
    const matchResults = document.getElementById("periodSearchMatchResults");
    matchResults.innerHTML = "";
    
    const allMatches = [];
    
    if (filters.Artist) {
        results.artists.forEach(artist => {
            allMatches.push({
                type: "Artist",
                name: artist.name,
                plays: artist.plays,
                time: artist.totalTime
            });
        });
    }
    
    if (filters.Song) {
        results.songs.forEach(song => {
            allMatches.push({
                type: "Song",
                name: song.name,
                plays: song.plays,
                time: song.totalTime
            });
        });
    }
    
    if (filters.Album) {
        results.albums.forEach(album => {
            allMatches.push({
                type: "Album",
                name: album.name,
                plays: album.plays,
                time: album.totalTime
            });
        });
    }

    if (filters.Genre) {
        results.genres.forEach(genre => {
            allMatches.push({
                type: "Genre",
                name: genre.name,
                plays: genre.plays,
                time: genre.totalTime
            });
        });
    }
    
    allMatches.sort((a, b) => b.plays - a.plays);
    
    if (allMatches.length === 0) {
        matchResults.innerHTML = "<p style='color: #888; text-align: center;'>No results found for \"" + query + "\"</p>";
    } else {
        allMatches.forEach(match => {
            const timeHours = Math.floor(match.time / (1000 * 60 * 60));
            const timeMinutes = Math.floor((match.time % (1000 * 60 * 60)) / (1000 * 60));
            const timeStr = timeHours > 0 ? `${timeHours}h ${timeMinutes}m` : `${timeMinutes}m`;
            
            const matchEl = document.createElement("div");
            matchEl.className = "search-match-item";
            matchEl.innerHTML = `
                <div class="match-type">${match.type}</div>
                <div class="match-name">${match.name}</div>
                <div class="match-details">
                    <div class="match-detail">
                        <strong>${match.plays}</strong>
                        Plays
                    </div>
                    <div class="match-detail">
                        <strong>${timeStr}</strong>
                        Time
                    </div>
                </div>
            `;
            
            // Allow clicking songs, artists, albums, or genres to see detailed stats
            if (match.type === "Song" || match.type === "Artist" || match.type === "Album" || match.type === "Genre") {
                matchEl.style.cursor = "pointer";
                matchEl.setAttribute("role", "button");
                matchEl.setAttribute("tabindex", "0");
                const open = () => {
                    if (match.type === "Song") {
                        openSongModal(match.name);
                    } else if (match.type === "Artist") {
                        const artistData = getArtistDataByName(match.name);
                        if (artistData) {
                            openArtistModal(artistData);
                        } else {
                            console.warn('Artist data unavailable for', match.name);
                        }
                    } else if (match.type === "Album") {
                        const albumData = getAlbumDataByName(match.name);
                        if (albumData) {
                            openAlbumModal(albumData);
                        } else {
                            console.warn('Album data unavailable for', match.name);
                        }
                    } else {
                        const genreData = getGenreDataByName(match.name);
                        if (genreData) {
                            openGenreModal(genreData);
                        } else {
                            console.warn('Genre data unavailable for', match.name);
                        }
                    }
                };
                matchEl.addEventListener("click", open);
                matchEl.addEventListener("keypress", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        open();
                    }
                });
            }
            
            matchResults.appendChild(matchEl);
        });
    }
}