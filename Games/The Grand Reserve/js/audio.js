// --- SYNTHESIZED TACTILE SOUNDS (Web Audio API) ---
let audioEnabled = false;
let audioCtx = null; // Lazily initialized to prevent console warnings on load

export function toggleAudio() {
	audioEnabled = !audioEnabled;
	if (audioEnabled) {
		if (!audioCtx) {
			audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		}
		if (audioCtx.state === "suspended") {
			audioCtx.resume();
		}
	}
	return audioEnabled;
}

export function playSound(type) {
	if (!audioEnabled) return;
	if (!audioCtx) {
		audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	}
	if (audioCtx.state === "suspended") {
		audioCtx.resume();
	}

	const now = audioCtx.currentTime;

	if (type === "pluck") {
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(600, now);
		osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
		gain.gain.setValueAtTime(0.15, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.start();
		osc.stop(now + 0.15);
	} else if (type === "squish") {
		const bufferSize = audioCtx.sampleRate * 0.1;
		const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
		const noise = audioCtx.createBufferSource();
		noise.buffer = buffer;
		const filter = audioCtx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(400, now);
		const gain = audioCtx.createGain();
		gain.gain.setValueAtTime(0.2, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
		noise.connect(filter);
		filter.connect(gain);
		gain.connect(audioCtx.destination);
		noise.start();
		noise.stop(now + 0.1);
	} else if (type === "pop") {
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(150, now);
		osc.frequency.exponentialRampToValueAtTime(20, now + 0.08);
		gain.gain.setValueAtTime(0.6, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.start();
		osc.stop(now + 0.08);
	} else if (type === "clink") {
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(987.77, now);
		osc.frequency.setValueAtTime(1318.51, now + 0.05);
		gain.gain.setValueAtTime(0.2, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.start();
		osc.stop(now + 0.4);
	} else if (type === "gurgle") {
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(80 + Math.random() * 50, now);
		osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
		gain.gain.setValueAtTime(0.3, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.start();
		osc.stop(now + 0.12);
	} else if (type === "tick") {
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(2200, now);
		gain.gain.setValueAtTime(0.08, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.start();
		osc.stop(now + 0.02);
	}
}
