const konamiCode = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
];
let konamiIndex = 0;

export function initKonamiCode(callback) {
    console.log("Initializing Konami Code listener...");
    document.addEventListener('keydown', e => {
        console.log(`Key pressed: ${e.key}`);
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                konamiIndex = 0;
                callback();
            }
        } else {
            konamiIndex = 0;
        }
    }, true);
}
