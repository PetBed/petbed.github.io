import { 获取农作物图标, 获取种子图标 } from './graphics.js';
import { playSound } from './audio.js';

/**
 * Creates a "flying" animation for a harvested crop from its plot to the Reserve tab.
 * @param {HTMLElement} plotElement The DOM element of the plot being harvested.
 * @param {string} cropType The key for the type of crop (e.g., 'pinot_noir').
 */
export function playHarvestAnimation(plotElement, cropType) {
    if (!plotElement || !window.gsap) return;

    const reserveTab = document.querySelector('[data-target="inventory"]');
    const sourceIcon = plotElement.querySelector('div'); // The div containing the SVG
    if (!reserveTab || !sourceIcon) return;

    // 1. Get start and end coordinates from the actual icon and target tab
    const startRect = sourceIcon.getBoundingClientRect();
    const endRect = reserveTab.getBoundingClientRect();

    // 2. Create the element to animate, positioned exactly over the source
    const flyingIcon = document.createElement('div');
    flyingIcon.innerHTML = 获取农作物图标(cropType);
    flyingIcon.style.position = 'fixed';
    flyingIcon.style.left = `${startRect.left}px`;
    flyingIcon.style.top = `${startRect.top}px`;
    flyingIcon.style.width = `${startRect.width}px`;
    flyingIcon.style.height = `${startRect.height}px`;
    flyingIcon.style.zIndex = '1000';
    flyingIcon.style.pointerEvents = 'none';
    document.body.appendChild(flyingIcon);

    // Hide the original icon inside the button
    sourceIcon.style.opacity = '0';

    // 3. Use a GSAP timeline for a multi-stage animation
    const tl = gsap.timeline({
        onComplete: () => {
            document.body.removeChild(flyingIcon);
            reserveTab.classList.add('tutorial-flash');
            setTimeout(() => reserveTab.classList.remove('tutorial-flash'), 700);
            playSound('pluck');
            // The plot will re-render to an empty state, so we don't need to restore opacity.
        }
    });

    // Animation sequence: Shake, Pop, and Fly
    tl.to(flyingIcon, { x: 'random(-3, 3)', y: 'random(-3, 3)', duration: 0.05, repeat: 4, yoyo: true }) // Quick shake
      .to(flyingIcon, { y: '-=20', scale: 1.2, duration: 0.2, ease: 'power1.out' }, '-=0.1') // Pop up
      .to(flyingIcon, {
        x: endRect.left - startRect.left + (endRect.width / 2) - (startRect.width / 2),
        y: endRect.top - startRect.top + (endRect.height / 2) - (startRect.height / 2),
        scale: 0.2,
        opacity: 0.5,
        duration: 0.8,
        ease: "power1.in",
    }, '+=0.1'); // Start flying after the pop
}

/**
 * Creates a "flying" animation for planting a seed from the selector to the plot.
 * @param {HTMLElement} seedButtonElement The seed button element that was clicked.
 * @param {HTMLElement} plotElement The destination plot element.
 * @param {string} seedType The key for the type of seed being planted.
 * @param {function} onCompleteCallback The function to call when the animation is finished.
 */
export function playPlantAnimation(startRect, seedIconHTML, plotElement, onCompleteCallback) {
	if (!startRect || !plotElement || !window.gsap) {
		if (onCompleteCallback) onCompleteCallback(); // Failsafe
		return;
	}

	const endRect = plotElement.getBoundingClientRect();

	const flyingIcon = document.createElement("div");
	flyingIcon.innerHTML = seedIconHTML;
	flyingIcon.style.position = "fixed";
	flyingIcon.style.left = `${startRect.left}px`;
	flyingIcon.style.top = `${startRect.top}px`;
	flyingIcon.style.width = `${startRect.width}px`;
	flyingIcon.style.height = `${startRect.height}px`;
	flyingIcon.style.zIndex = "1000";
	flyingIcon.style.pointerEvents = "none";
	document.body.appendChild(flyingIcon);

	const tl = gsap.timeline({
		onComplete: () => {
			document.body.removeChild(flyingIcon);
			if (onCompleteCallback) onCompleteCallback();
		},
	});

	// Define animation targets
	const endX = endRect.left - startRect.left + (endRect.width / 2) - startRect.width / 2;
	const endY = endRect.top - startRect.top + (endRect.height / 2) - startRect.height / 2;
	const midX = endX / 2;
	const arcHeight = -60; // 60px up

	// Animation sequence: Enlarge, Arc, and Impact
	tl.to(flyingIcon, {
		scale: 3.5, // 1. Enlarge the seed icon first
		duration: 0.2,
		ease: "power1.out",
	})
		.to(flyingIcon, {
			x: midX,
			y: arcHeight,
			ease: "power1.out", // 2. Arc up
			duration: 0.35,
		}, ">")
		.to(flyingIcon, {
			x: endX,
			y: endY,
			ease: "power1.in", // 3. Arc down
			duration: 0.35,
		})
		.to(flyingIcon, {
			// Shrink as it lands
			scale: 0,
			duration: 0.1,
		}, "-=0.1")
		.to(plotElement, { scaleY: 0.9, scaleX: 1.1, duration: 0.1, ease: "power1.inOut", onStart: () => { playSound("squish"); createDustPuff(endRect); } }, "-=0.1")
		.to(plotElement, { scaleY: 1, scaleX: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });
}

function createDustPuff(endRect) {
    const numParticles = 10; // More particles
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = `${endRect.left + endRect.width / 2}px`;
        particle.style.top = `${endRect.top + endRect.height / 2}px`;
        particle.style.width = `${Math.random() * 12 + 6}px`; // Bigger particles
        particle.style.height = particle.style.width;
        particle.style.backgroundColor = '#8B5A2B'; // Dirt color
        particle.style.borderRadius = '50%';
        particle.style.zIndex = '999';
        document.body.appendChild(particle);

        gsap.to(particle, {
            x: `random(-50, 50)`, // Wider spread
            y: `random(-40, -60)`, // Higher pop
            scale: 0,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
            onComplete: () => particle.remove()
        });
    }
}

export function playPurchaseAnimation(sourceElement, itemKey, itemType) {
    if (!sourceElement || !window.gsap) return;

    const reserveTab = document.querySelector('[data-target="inventory"]');
    if (!reserveTab) return;

    const startRect = sourceElement.getBoundingClientRect();
    const endRect = reserveTab.getBoundingClientRect();

    const flyingIcon = document.createElement('div');
    const iconHTML = (itemType === 'seed') ? 获取种子图标(itemKey) : 获取农作物图标(itemKey);
    flyingIcon.innerHTML = iconHTML;
    
    flyingIcon.style.position = 'fixed';
    flyingIcon.style.left = `${startRect.left + startRect.width / 2}px`;
    flyingIcon.style.top = `${startRect.top + startRect.height / 2}px`;
    flyingIcon.style.width = `40px`;
    flyingIcon.style.height = `40px`;
    flyingIcon.style.transform = 'translate(-50%, -50%)';
    flyingIcon.style.zIndex = '1000';
    flyingIcon.style.pointerEvents = 'none';
    document.body.appendChild(flyingIcon);

    const tl = gsap.timeline({
        onComplete: () => {
            document.body.removeChild(flyingIcon);
            reserveTab.classList.add('tutorial-flash');
            setTimeout(() => reserveTab.classList.remove('tutorial-flash'), 700);
            playSound('clink');
        }
    });

    tl.from(flyingIcon, { scale: 0, duration: 0.2, ease: 'back.out(1.7)' })
      .to(flyingIcon, {
        x: endRect.left - (startRect.left + startRect.width / 2) + (endRect.width / 2),
        y: endRect.top - (startRect.top + startRect.height / 2) + (endRect.height / 2),
        scale: 0.2,
        opacity: 0.5,
        duration: 0.8,
        ease: "power1.in",
    });
}

export function playAddToPressAnimation(startRect, iconHTML, targetElement, onCompleteCallback) {
    if (!startRect || !targetElement || !window.gsap) {
        if (onCompleteCallback) onCompleteCallback();
        return;
    }

    const endRect = targetElement.getBoundingClientRect();

    const flyingIcon = document.createElement('div');
    flyingIcon.innerHTML = iconHTML;
    flyingIcon.style.position = 'fixed';
    flyingIcon.style.left = `${startRect.left}px`;
    flyingIcon.style.top = `${startRect.top}px`;
    flyingIcon.style.width = `${startRect.width}px`;
    flyingIcon.style.height = `${startRect.height}px`;
    flyingIcon.style.zIndex = '1000';
    flyingIcon.style.pointerEvents = 'none';
    document.body.appendChild(flyingIcon);

    const tl = gsap.timeline({
        onComplete: () => {
            document.body.removeChild(flyingIcon);
            if (onCompleteCallback) onCompleteCallback();
        }
    });

    tl.to(flyingIcon, {
        x: endRect.left - startRect.left + (endRect.width / 2) - (startRect.width / 2),
        y: endRect.top - startRect.top + (endRect.height / 2) - (startRect.height / 2),
        scale: 1.5, // Grow as it flies
        duration: 0.4,
        ease: 'power1.inOut'
    })
    .to(flyingIcon, { scale: 1, duration: 0.15 }, "-=0.1") // Shrink to normal size on land
    .to(targetElement, { 
        scale: 1.15, 
        duration: 0.1, 
        yoyo: true, 
        repeat: 1, 
        ease: 'power1.inOut',
        onStart: () => playSound('pluck')
    }, "-=0.15");
}

/**
 * Animates the main gold display by counting up to the new value.
 * @param {number} startValue The starting gold amount.
 * @param {number} endValue The ending gold amount.
 */
export function playGoldCountUpAnimation(startValue, endValue) {
    if (!window.gsap) return;
    const goldEl = document.getElementById('ui-gold');
    if (!goldEl) return;

    const proxy = { value: startValue };
    gsap.to(proxy, {
        value: endValue,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
            goldEl.textContent = Math.round(proxy.value);
        },
    });
}

/**
 * Creates a floating "+$X" text animation from a source element.
 * @param {number} amount The amount of gold earned.
 * @param {HTMLElement} sourceElement The DOM element where the gold was earned.
 */
export function playGoldPopupAnimation(amount, sourceElement) {
    if (!sourceElement || !window.gsap || amount <= 0) return;

    const startRect = sourceElement.getBoundingClientRect();

    const popup = document.createElement('div');
    popup.textContent = `+$${amount}`;
    popup.className = 'fixed z-[1001] text-lg font-extrabold text-yellow-500 drop-shadow-lg pointer-events-none';
    popup.style.left = `${startRect.left + startRect.width / 2}px`;
    popup.style.top = `${startRect.top}px`;
    popup.style.transform = 'translateX(-50%)';
    document.body.appendChild(popup);

    gsap.to(popup, {
        y: -80, // Move up 80px
        opacity: 0,
        duration: 1.5,
        ease: 'power1.out',
        onComplete: () => {
            document.body.removeChild(popup);
        }
    });
}