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

// Helper: Search for artist, song, or album
function searchData(data, query) {
    const lowerQuery = query.toLowerCase();
    
    const results = {
        artists: [],
        songs: [],
        albums: []
    };
    
    data.forEach(item => {
        const artist = (item["Artist"] || "").toLowerCase();
        const songName = (item["Name"] || "").toLowerCase();
        const album = (item["Album"] || "").toLowerCase();
        
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
    });
    
    // Count plays and time for each match
    data.forEach(item => {
        const duration = parseInt(item["Duration"]) || 0;
        
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
    });
    
    // Sort by plays
    results.artists.sort((a, b) => b.plays - a.plays);
    results.songs.sort((a, b) => b.plays - a.plays);
    results.albums.sort((a, b) => b.plays - a.plays);
    
    return results;
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

function renderSearchResults(results, query) {
    const totalPlays = (results.artists.reduce((a, b) => a + b.plays, 0) + 
                        results.songs.reduce((a, b) => a + b.plays, 0) + 
                        results.albums.reduce((a, b) => a + b.plays, 0));
    
    const totalMs = (results.artists.reduce((a, b) => a + b.totalTime, 0) + 
                     results.songs.reduce((a, b) => a + b.totalTime, 0) + 
                     results.albums.reduce((a, b) => a + b.totalTime, 0));
    
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
    
    results.artists.forEach(artist => {
        allMatches.push({
            type: "Artist",
            name: artist.name,
            plays: artist.plays,
            time: artist.totalTime
        });
    });
    
    results.songs.forEach(song => {
        allMatches.push({
            type: "Song",
            name: song.name,
            plays: song.plays,
            time: song.totalTime
        });
    });
    
    results.albums.forEach(album => {
        allMatches.push({
            type: "Album",
            name: album.name,
            plays: album.plays,
            time: album.totalTime
        });
    });
    
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
function renderPeriodStats(periodData, period) {
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
    const periodLabel = period === 'today' ? "Today's" : period === 'weekly' ? "This Week's" : "This Month's";
    document.getElementById("period-summary-title").textContent = `${periodLabel} Stats`;
    document.getElementById("periodSongs-title").textContent = `${periodLabel} Songs`;
    document.getElementById("periodArtists-title").textContent = `${periodLabel} Artists`;
    document.getElementById("periodAlbums-title").textContent = `${periodLabel} Albums`;

    // Get frequency data
    const periodSongs = countFrequency(periodData, "Name");
    const periodArtists = countFrequency(periodData, "Artist");
    const periodAlbums = countFrequency(periodData, "Album");

    // Render songs list
    const songsList = document.getElementById("periodSongsList");
    songsList.innerHTML = "";
    periodSongs.forEach(([name, count]) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
        songsList.appendChild(li);
    });

    // Render artists list
    const artistsList = document.getElementById("periodArtistsList");
    artistsList.innerHTML = "";
    periodArtists.forEach(([name, count]) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
        artistsList.appendChild(li);
    });

    // Render albums list
    const albumsList = document.getElementById("periodAlbumsList");
    albumsList.innerHTML = "";
    periodAlbums.forEach(([name, count]) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
        albumsList.appendChild(li);
    });
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
            renderArtistCards(artistStats.slice(0, 10));
        } catch (err) {
            console.warn('Artist cards render failed:', err);
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
    });
});

// Period switching functionality (for Today/Weekly/Monthly stats)
document.querySelectorAll('.period-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const period = e.target.dataset.period;
        let filteredData;
        
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

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    if (query.length === 0) {
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('searchMatchResults').innerHTML = '';
    } else {
        const results = searchData(window.allData, query);
        renderSearchResults(results, query);
    }
});

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