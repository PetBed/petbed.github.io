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

        // --- Update DOM ---
        document.getElementById("totalTracks").textContent = totalTracks;
        document.getElementById("listeningTime").textContent = `${hours}h ${minutes}m`;
        document.getElementById("topArtist").textContent = topArtists[0]?.[0] || "N/A";
        // document.getElementById("topGenre").textContent = topGenres[0]?.[0] || "N/A";
        document.getElementById("topAlbum").textContent = topAlbums[0]?.[0] || "N/A";

        // --- Render Artist List ---
        const artistList = document.getElementById("artistList");
        artistList.innerHTML = ""; // Clear current list
        topArtists.slice(0, 10).forEach(([name, count]) => {
            const li = document.createElement("li");
            li.innerHTML = `<span>${name}</span> <span style="color:#aaa; font-size: 0.9em;">${count} plays</span>`;
            artistList.appendChild(li);
        });

        // --- Render Genre Chart ---
        renderGenreChart(topGenres);
        renderHeatmap(data);

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


loadData();