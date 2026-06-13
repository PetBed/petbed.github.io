import { state, globals } from './state.js';
import { updateHeaderUI, renderContractsBoard, showToast, renderWarehouse } from './ui.js';
import { startLoop, setWeather, setDialogueDifficulty } from './engine.js';
import { resetGameState } from './storage.js';
import { initKonamiCode } from './konami.js';
import { generateSolvableContract } from './contracts.js';
import { playSound } from './audio.js';
import { RECIPES } from './data.js';


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

function addOrder() {
  const newContract = generateSolvableContract();
  if (newContract) {
      state.contracts.push(newContract);
      renderContractsBoard();
      showToast("Playtest: New order generated!");
      playSound("clink");
  } else {
      showToast("Playtest: Failed to generate a solvable order.", "error");
  }
}

function clearOrders() {
  state.contracts = [];
  renderContractsBoard();
  showToast("Playtest: All orders cleared.");
}

function spawnWine() {
    const recipeKey = document.getElementById('spawn-recipe').value;
    const sw = parseInt(document.getElementById('spawn-sw').value, 10) || 0;
    const ac = parseInt(document.getElementById('spawn-ac').value, 10) || 0;
    const tn = parseInt(document.getElementById('spawn-tn').value, 10) || 0;
    const bd = parseInt(document.getElementById('spawn-bd').value, 10) || 0;

    if (!recipeKey) {
        showToast("Please select a recipe.", "error");
        return;
    }

    const newWine = {
        id: `wine_playtest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        recipeKey: recipeKey,
        qualityKey: 's', // Default to S-Tier for testing convenience
        age: 0,
        rankIndex: 0,
        flavour: { 
            sw: Math.max(0, Math.min(100, sw)), 
            ac: Math.max(0, Math.min(100, ac)), 
            tn: Math.max(0, Math.min(100, tn)), 
            bd: Math.max(0, Math.min(100, bd)) 
        },
        customLabel: null
    };

    state.wines.push(newWine);

    showToast(`Spawned 1x S-Tier ${RECIPES[recipeKey].name}`, "success");
    renderWarehouse();
    updateHeaderUI();
}

function updateDifficultyButtons() {
    const sidebar = document.getElementById('playtest-sidebar');
    if (!sidebar) return;
    sidebar.querySelectorAll('[data-difficulty]').forEach(btn => {
        if (btn.dataset.difficulty === state.dialogueDifficulty) {
            btn.classList.add('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-stone-800');
        } else {
            btn.classList.remove('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-stone-800');
        }
    });
}

function updateUIToggleButtons() {
    const sidebar = document.getElementById('playtest-sidebar');
    if (!sidebar) return;

    const toggle = document.getElementById('toggle-ranges');
    if (!toggle) return;
    const knob = toggle.querySelector('span');
    
    if (globals.showContractRanges) {
        toggle.classList.replace('bg-gray-600', 'bg-green-500');
        knob.style.transform = 'translateX(1.25rem)';
    } else {
        toggle.classList.replace('bg-green-500', 'bg-gray-600');
        knob.style.transform = '';
    }
}

export function initPlaytest() {
  console.log("Initializing playtest features...");
  initKonamiCode(togglePlaytestSidebar);

  const sidebar = document.createElement('div');
  sidebar.id = 'playtest-sidebar';
  sidebar.className = 'hidden fixed top-0 right-0 h-full bg-stone-800 text-white p-4 w-72 z-50 shadow-lg overflow-y-auto';
  sidebar.innerHTML = `
    <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">Playtest Controls</h3>
        <button id="close-playtest-btn" class="text-stone-400 hover:text-white p-1 rounded-full text-2xl leading-none">&times;</button>
    </div>
    
    <div class="space-y-2">
        <!-- General Controls Section -->
        <div class="bg-stone-900/50 rounded-lg">
            <button data-collapsible-target="general-controls" class="w-full flex justify-between items-center p-3 text-left font-bold">
                <span>General Controls</span>
                <i data-lucide="chevron-down" class="w-5 h-5 transition-transform transform rotate-180"></i>
            </button>
            <div id="general-controls" class="p-3 border-t border-stone-700 space-y-2">
                <button id="add-money-btn" class="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded">Add 1000 Gold</button>
                <button id="reset-game-btn" class="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Reset Game State</button>
            </div>
        </div>

        <!-- Game Speed Section -->
        <div class="bg-stone-900/50 rounded-lg">
            <button data-collapsible-target="speed-controls" class="w-full flex justify-between items-center p-3 text-left font-bold">
                <span>Game Speed</span>
                <i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i>
            </button>
            <div id="speed-controls" class="p-3 border-t border-stone-700 hidden">
                <div class="grid grid-cols-3 gap-2">
                    <button data-speed="0" class="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-4 rounded">Pause</button>
                    <button data-speed="1" class="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded">1x</button>
                    <button data-speed="0.5" class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded">0.5x</button>
                    <button data-speed="2" class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded">2x</button>
                    <button data-speed="3" class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded">3x</button>
                </div>
            </div>
        </div>

        <!-- Weather Control Section -->
        <div class="bg-stone-900/50 rounded-lg">
            <button data-collapsible-target="weather-controls" class="w-full flex justify-between items-center p-3 text-left font-bold">
                <span>Weather Control</span>
                <i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i>
            </button>
            <div id="weather-controls" class="p-3 border-t border-stone-700 hidden">
                <div class="grid grid-cols-2 gap-2">
                    <button data-weather="sunny" class="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded">Sunny</button>
                    <button data-weather="rain" class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded">Rain</button>
                    <button data-weather="mist" class="bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded">Mist</button>
                    <button data-weather="temperate" class="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded">Temperate</button>
                </div>
            </div>
        </div>

        <!-- Order Board Section -->
        <div class="bg-stone-900/50 rounded-lg">
            <button data-collapsible-target="order-controls" class="w-full flex justify-between items-center p-3 text-left font-bold">
                <span>Order Board Control</span>
                <i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i>
            </button>
            <div id="order-controls" class="p-3 border-t border-stone-700 hidden">
                <div class="grid grid-cols-2 gap-2">
                    <button id="add-order-btn" class="bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-4 rounded">Add Order</button>
                    <button id="clear-orders-btn" class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Clear Orders</button>
                </div>
            </div>
        </div>

        <!-- UI & Dialogue Section -->
        <div class="bg-stone-900/50 rounded-lg">
            <button data-collapsible-target="ui-controls" class="w-full flex justify-between items-center p-3 text-left font-bold">
                <span>UI & Dialogue</span>
                <i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i>
            </button>
            <div id="ui-controls" class="p-3 border-t border-stone-700 hidden space-y-4">
                <div>
                    <h4 class="font-bold mb-2 text-sm">Dialogue Difficulty</h4>
                    <div class="grid grid-cols-3 gap-2" id="difficulty-controls">
                        <button data-difficulty="beginner" class="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-2 rounded text-xs">Beginner</button>
                        <button data-difficulty="intermediate" class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-2 rounded text-xs">Intermediate</button>
                        <button data-difficulty="sommelier" class="bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 px-2 rounded text-xs">Sommelier</button>
                    </div>
                </div>
                <div>
                    <h4 class="font-bold mb-2 text-sm">UI Toggles</h4>
                    <div class="flex items-center justify-between bg-stone-700 p-2 rounded-lg">
                        <label for="toggle-ranges" class="text-sm font-medium text-white">Show Order Ranges</label>
                        <button id="toggle-ranges" type="button" role="switch" aria-checked="false" class="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Wine Spawner Section -->
        <div class="bg-stone-900/50 rounded-lg">
            <button data-collapsible-target="spawner-controls" class="w-full flex justify-between items-center p-3 text-left font-bold">
                <span>Wine Spawner</span>
                <i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i>
            </button>
            <div id="spawner-controls" class="p-3 border-t border-stone-700 hidden space-y-3">
                <div>
                    <label for="spawn-recipe" class="text-xs font-bold text-stone-400 mb-1 block">Recipe</label>
                    <select id="spawn-recipe" class="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-velvet-600"></select>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label for="spawn-sw" class="text-xs font-bold text-stone-400 mb-1 block">Sweetness</label>
                        <input type="number" id="spawn-sw" value="50" min="0" max="100" class="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-200">
                    </div>
                    <div>
                        <label for="spawn-ac" class="text-xs font-bold text-stone-400 mb-1 block">Acidity</label>
                        <input type="number" id="spawn-ac" value="50" min="0" max="100" class="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-200">
                    </div>
                    <div>
                        <label for="spawn-tn" class="text-xs font-bold text-stone-400 mb-1 block">Tannin</label>
                        <input type="number" id="spawn-tn" value="50" min="0" max="100" class="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-200">
                    </div>
                    <div>
                        <label for="spawn-bd" class="text-xs font-bold text-stone-400 mb-1 block">Body</label>
                        <input type="number" id="spawn-bd" value="50" min="0" max="100" class="w-full bg-stone-950 border border-stone-800 rounded px-2 py-1.5 text-xs text-stone-200">
                    </div>
                </div>
                <button id="spawn-wine-btn" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg">Spawn Wine</button>
            </div>
        </div>
    </div>
  `;

  document.body.appendChild(sidebar);
  if (window.lucide) window.lucide.createIcons();

  // Add event listeners for collapsible sections
  sidebar.querySelectorAll('[data-collapsible-target]').forEach(header => {
      header.addEventListener('click', () => {
          const targetId = header.dataset.collapsibleTarget;
          const targetPanel = document.getElementById(targetId);
          const icon = header.querySelector('i');
          
          targetPanel.classList.toggle('hidden');
          icon.classList.toggle('rotate-180');
      });
  });

  document.getElementById('close-playtest-btn').addEventListener('click', togglePlaytestSidebar);
  document.getElementById('add-money-btn').addEventListener('click', addMoney);
  document.getElementById('reset-game-btn').addEventListener('click', resetGameState);
  document.getElementById('add-order-btn').addEventListener('click', addOrder);
  document.getElementById('clear-orders-btn').addEventListener('click', clearOrders);

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

  sidebar.querySelectorAll('[data-difficulty]').forEach(button => {
    button.addEventListener('click', () => {
        setDialogueDifficulty(button.dataset.difficulty);
        updateDifficultyButtons();
    });
  });

  updateDifficultyButtons();

  document.getElementById('toggle-ranges').addEventListener('click', () => {
      globals.showContractRanges = !globals.showContractRanges;
      updateUIToggleButtons();
      renderContractsBoard(); // Re-render contracts to show/hide ranges
  });

  updateUIToggleButtons();

  // Populate recipe dropdown for spawner
  const recipeSelect = sidebar.querySelector('#spawn-recipe');
  if (recipeSelect) {
      Object.keys(RECIPES).forEach(key => {
          if (key !== 'fruit_cider' && key !== 'house_red') {
              const option = document.createElement('option');
              option.value = key;
              option.textContent = RECIPES[key].name;
              recipeSelect.appendChild(option);
          }
      });
  }
  document.getElementById('spawn-wine-btn').addEventListener('click', spawnWine);
}
