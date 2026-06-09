import {initializeApp} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {getFirestore, doc, getDoc, setDoc, onSnapshot} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {state} from "./state.js";
import {updateHeaderUI, renderPlots, renderCellarUI, renderWarehouse, renderMarket, renderShop, renderBreweryUI, renderRacks, showToast} from "./ui.js";

// --- FIREBASE SYNC & STORAGE CORE ---
const appId = typeof __app_id !== "undefined" ? __app_id : "grand-reserve-default";
let db = null;
let auth = null;
let syncEnabled = false;
let syncUserId = null;
let unsubscribeSync = null;
let lastSyncHash = "";
let saveTimeout = null;

export async function initFirebase() {
	if (typeof __firebase_config === "undefined") {
		updateSyncStatus("offline", "Local Profile");
		return;
	}
	try {
		const firebaseConfig = JSON.parse(__firebase_config);
		const app = initializeApp(firebaseConfig);
		db = getFirestore(app);
		auth = getAuth(app);

		updateSyncStatus("connecting", "Connecting...");

		if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
			await signInWithCustomToken(auth, __initial_auth_token);
		} else {
			await signInAnonymously(auth);
		}

		onAuthStateChanged(auth, (user) => {
			if (user) {
				const syncOverride = localStorage.getItem("grand_reserve_sync_code_override");
				syncUserId = syncOverride || user.uid;
				syncEnabled = true;

				const displayInput = document.getElementById("sync-code-display");
				if (displayInput) displayInput.value = syncUserId;

				updateSyncStatus("connected", "Cloud Synced");
				setupRealtimeSync();
			} else {
				syncEnabled = false;
				updateSyncStatus("disconnected", "Disconnected");
			}
		});
	} catch (err) {
		console.error("Firebase Sync Setup Failed: ", err);
		updateSyncStatus("offline", "Local Profile");
	}
}

function setupRealtimeSync() {
	if (!syncEnabled || !syncUserId || !db) return;
	if (unsubscribeSync) unsubscribeSync();

	const saveDocRef = doc(db, "artifacts", appId, "users", syncUserId, "saves", "current");

	unsubscribeSync = onSnapshot(
		saveDocRef,
		(docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				if (data.hash !== lastSyncHash) {
					lastSyncHash = data.hash;
					applySaveState(data.state);
				}
			} else {
				uploadCloudSave();
			}
		},
		(err) => {
			console.error("Realtime sync issue:", err);
			updateSyncStatus("error", "Sync Blocked");
		},
	);
}

function serializeSaveState() {
	return {
		gold: state.gold,
		seeds: state.seeds,
		ingredients: state.ingredients,
		wines: state.wines,
		wineRacks: state.wineRacks,
		beers: state.beers, // Assuming beers don't have complex flavour states in barrels
		plots: state.plots, // Assuming plots don't have complex flavour states in barrels
		barrels: state.barrels.map(b => ({ // Ensure all barrel properties are serialized
			...b,
			baseWineFlavour: b.baseWineFlavour,
			flavour: b.flavour,
		})),
		kettleUnlocked: state.kettleUnlocked,
		kettle: state.kettle,
		shop: { // Ensure shop properties are serialized, especially barrelsOwned
			...state.shop,
			barrelsOwned: state.shop.barrelsOwned,
		},
	};
}

function applySaveState(serializedData) {
	if (!serializedData) return;
	try {
		state.gold = serializedData.gold ?? state.gold;
		state.seeds = serializedData.seeds ?? state.seeds;
		state.ingredients = serializedData.ingredients ?? state.ingredients;
		state.wines = serializedData.wines ?? state.wines;
		state.wineRacks = serializedData.wineRacks ?? state.wineRacks;
		state.plots = serializedData.plots ?? state.plots; // Assuming plots don't have complex flavour states in barrels
		state.barrels = serializedData.barrels ?? state.barrels; // Restore barrels array
		// Ensure new flavour properties are correctly merged for existing barrels
		state.barrels.forEach((barrel, index) => {
			if (serializedData.barrels && serializedData.barrels[index]) {
				barrel.baseWineFlavour = serializedData.barrels[index].baseWineFlavour ?? barrel.baseWineFlavour;
				barrel.flavour = serializedData.barrels[index].flavour ?? barrel.flavour;
			}
		});
		state.kettleUnlocked = serializedData.kettleUnlocked ?? state.kettleUnlocked;
		state.kettle = serializedData.kettle ?? state.kettle;
		state.shop = serializedData.shop ?? state.shop;

		// MIGRATION: Convert old beer tally object to new array-based system for customization support
		if (serializedData.beers && typeof serializedData.beers === "object" && !Array.isArray(serializedData.beers)) {
			const migratedBeers = [];
			for (const [recipeKey, count] of Object.entries(serializedData.beers)) {
				for (let i = 0; i < count; i++) {
					migratedBeers.push({
						id: "beer_mig_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
						recipeKey: recipeKey,
					});
				}
			}
			state.beers = migratedBeers;
		} else {
			state.beers = serializedData.beers ?? state.beers;
		}

		updateHeaderUI();
		renderPlots();
		renderCellarUI();
		renderWarehouse();
		renderMarket();
		renderShop();
		renderBreweryUI();
		renderRacks();
	} catch (err) {
		console.error("Failed to apply save state:", err);
	}
}

export async function uploadCloudSave() {
	if (!syncEnabled || !syncUserId || !db) return;
	try {
		updateSyncStatus("connecting", "Syncing...");
		const saveDocRef = doc(db, "artifacts", appId, "users", syncUserId, "saves", "current");
		const stateData = serializeSaveState();
		const currentHash = Math.random().toString(36).substring(2, 9);
		lastSyncHash = currentHash;

		await setDoc(saveDocRef, {
			state: stateData,
			hash: currentHash,
			updatedAt: Date.now(),
		});
		updateSyncStatus("connected", "Cloud Synced");
	} catch (err) {
		console.error("Cloud save write failed:", err);
		updateSyncStatus("error", "Sync Failed");
	}
}

function updateSyncStatus(status, label) {
	const dot = document.getElementById("sync-indicator");
	const modalDot = document.getElementById("sync-status-dot");
	const statusText = document.getElementById("sync-status-text");

	let dotColor = "bg-amber-500 animate-pulse";
	let modalColor = "bg-amber-500 animate-pulse";

	if (status === "connected") {
		dotColor = "bg-green-500";
		modalColor = "bg-green-500";
	} else if (status === "connecting") {
		dotColor = "bg-yellow-500 animate-ping";
		modalColor = "bg-yellow-500 animate-ping";
	} else if (status === "error") {
		dotColor = "bg-red-500";
		modalColor = "bg-red-500 animate-pulse";
	} else if (status === "offline") {
		dotColor = "bg-stone-400";
		modalColor = "bg-stone-400";
	}

	if (dot) dot.className = `absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${dotColor}`;
	if (modalDot) modalDot.className = `w-2 h-2 rounded-full ${modalColor}`;
	if (statusText) statusText.textContent = label;
}

export function openSyncModal() {
	document.getElementById("sync-modal").classList.remove("hidden");
}

export function closeSyncModal() {
	document.getElementById("sync-modal").classList.add("hidden");
}

export function copySyncCode() {
	const input = document.getElementById("sync-code-display");
	if (input && input.value !== "Connecting...") {
		input.select();
		document.execCommand("copy");
		showToast("Copied Sync Code to Clipboard!");
	}
}

export async function loadRemoteSyncCode() {
	const inputVal = document.getElementById("sync-code-input").value.trim();
	if (!inputVal) {
		showToast("Please paste a Sync Code.");
		return;
	}
	if (inputVal === syncUserId) {
		showToast("This is already your active profile!");
		return;
	}

	updateSyncStatus("connecting", "Linking Account...");
	try {
		const remoteDocRef = doc(db, "artifacts", appId, "users", inputVal, "saves", "current");
		const docSnap = await getDoc(remoteDocRef);

		if (docSnap.exists()) {
			localStorage.setItem("grand_reserve_sync_code_override", inputVal);
			syncUserId = inputVal;

			const displayInput = document.getElementById("sync-code-display");
			if (displayInput) displayInput.value = syncUserId;

			setupRealtimeSync();
			showToast("Profile Successfully Connected!");
			closeSyncModal();
		} else {
			showToast("No active save found for that Sync Code.");
			updateSyncStatus("connected", "Cloud Synced");
		}
	} catch (err) {
		console.error("Account linking failure:", err);
		showToast("Database denied connection. Check network.");
		updateSyncStatus("error", "Connection Blocked");
	}
}

export function triggerManualSync() {
	if (syncEnabled) {
		uploadCloudSave();
		showToast("Force save queued successfully!");
	} else {
		showToast("Sync unavailable. Offline sandbox.");
	}
}

export function triggerAutoSave() {
	if (!syncEnabled || !syncUserId || !db) return;
	if (saveTimeout) clearTimeout(saveTimeout);

	saveTimeout = setTimeout(() => {
		uploadCloudSave();
	}, 3000);
}
