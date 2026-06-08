import { state, globals } from './state.js';
import { updateHeaderUI } from './ui.js';
import { startLoop, setWeather } from './engine.js';
import { initKonamiCode } from './konami.js';

function togglePlaytestSidebar() {
  const sidebar = document.getElementById('playtest-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('hidden');
  }
}

function addMoney() {
  state.gold += 1000;
  updateHeaderUI();
}

function setGameSpeed(multiplier) {
    if (globals.gameLoopInterval) {
        clearInterval(globals.gameLoopInterval);
    }
    globals.gameLoopInterval = startLoop(multiplier);
}

export function initPlaytest() {
  console.log("Initializing playtest features...");
  initKonamiCode(togglePlaytestSidebar);

  const sidebar = document.createElement('div');
  sidebar.id = 'playtest-sidebar';
  sidebar.className =
    'hidden fixed top-0 right-0 h-full bg-stone-800 text-white p-4 w-64 z-50 shadow-lg';
  sidebar.innerHTML = `
    <h3 class="text-lg font-bold mb-4">Playtest Controls</h3>
    <div class="flex flex-col gap-2">
      <button id="add-money-btn" class="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded">
        Add 1000 Gold
      </button>
      <div class="grid grid-cols-3 gap-2">
        <button data-speed="0" class="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-4 rounded">Pause</button>
        <button data-speed="1" class="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded">1x</button>
        <button data-speed="0.5" class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded">0.5x</button>
        <button data-speed="2" class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded">2x</button>
        <button data-speed="3" class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded">3x</button>
      </div>
      <div class="mt-4">
        <h4 class="font-bold mb-2">Weather Control</h4>
        <div class="grid grid-cols-2 gap-2">
            <button data-weather="sunny" class="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded">Sunny</button>
            <button data-weather="rain" class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded">Rain</button>
            <button data-weather="mist" class="bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded">Mist</button>
            <button data-weather="temperate" class="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded">Temperate</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(sidebar);

  document.getElementById('add-money-btn').addEventListener('click', addMoney);

  sidebar.querySelectorAll('[data-speed]').forEach(button => {
    button.addEventListener('click', () => {
      const speed = parseFloat(button.dataset.speed);
      if (speed === 0) {
        if (globals.gameLoopInterval) {
            clearInterval(globals.gameLoopInterval);
            globals.gameLoopInterval = null;
        }
      } else {
        setGameSpeed(speed);
      }
    });
  });

  sidebar.querySelectorAll('[data-weather]').forEach(button => {
    button.addEventListener('click', () => {
        setWeather(button.dataset.weather);
    });
  });
}
