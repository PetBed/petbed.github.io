const intro = document.getElementById("intro");
const introImg = document.getElementById("intro-img");
const introCenterDiv = document.getElementById("intro-center");
const introLeftDiv = document.getElementById("intro-left");
const introRightDiv = document.getElementById("intro-right");
const introImgLeft = document.getElementById("intro-img-left");
const introImgRight = document.getElementById("intro-img-right");

function resetViewport() {
  window.scrollTo(0, 0);
  // [intro, introImg].forEach(el => el.style.transform = 'none');
  // intro.style.clipPath = 'circle(50%)';
  // introCenterDiv.style.display = 'block';
  // introCenterDiv.style.opacity = '0';
  // introLeftDiv.style.transform = 'translateX(-100%)';
  // introRightDiv.style.transform = 'translateX(100%)';
  // [intro, introImg, introCenterDiv].forEach(el => el.getAnimations().forEach(anim => anim.cancel()));
  // introCenterDiv.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}

// resetViewport();
// centerLeft();

// const animateIntro = () => {
//   const animations = [
//     intro.animate([
//       { width: "0vmin", height: "0vmin" },
//       { width: "120vmin", height: "120vmin", offset: 0.2 },
//       { width: "180vmin", height: "180vmin", offset: 0.4 },
//       { width: "240vmin", height: "240vmin", offset: 0.6 },
//       { width: "300vmin", height: "300vmin" }
//     ], { duration: 1500, fill: "none", easing: "cubic-bezier(0.22, 1, 0.36, 1)" }),
//     introImg.animate([
//       { width: "150vmin" },
//       { width: "220vmin", offset: 0.6 },
//       { width: "260vmin" }
//     ], { duration: 1500, fill: "none", easing: "cubic-bezier(0.22, 1, 0.36, 1)" })
//   ];
//   intro.style.width = "300vmin";
//   intro.style.height = "300vmin";
//   introImg.style.width = "260vmin";
//   return Promise.all(animations.map(a => a.finished));
// };

// const revealIntroBody = () => {
//   introCenterDiv.style.display = "block";
//   const animations = [
//     introCenterDiv.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: "ease-in-out", fill: "none" }),
//     intro.animate([{ clipPath: 'circle(50%)' }, { clipPath: 'inset(0)' }], { duration: 500, easing: "ease-in-out", fill: "none" }),
//     introImg.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.98)' }], { duration: 1000, easing: "ease-out", fill: "none" })
//   ];
//   return Promise.all(animations.map(a => a.finished)).then(() => {
//     introCenterDiv.style.opacity = '1';
//     // intro.style.clipPath = 'inset(0)';
//     introImg.style.transform = 'scale(0.98)';
//     intro.style.clipPath = 'none';
//     intro.style.width = '';
//     intro.style.height = 'fit-content';
//   });
// };

// setTimeout(() => {
//   animateIntro().then(revealIntroBody).catch(console.error);
// }, 100);

var transX = -100;
intro.style.transform = `translateX(${transX}vw)`;

function disableScroll() {
  document.body.style.overflow = 'hidden';
}

function enableScroll() {
  document.body.style.overflow = '';
}

function slideLeft(){
  if (transX < 0) {
    transX += 100;
    gsap.to(intro, {
      duration: 1,
      x: `${transX}vw`,
      ease: "power2.out"
    });
    
    gsap.to("#intro-scroll", {
      duration: .8,
      x: `${-transX - 100}vw`,
      rotation: "-=360",
      ease: "power2.out",
      delay: 0.2
    });

    // Scroll back to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  if (transX === 0) {
    disableScroll();
  } else {
    enableScroll();
  }
}

function slideRight(){
  if (transX > -200) {
    transX -= 100;
    gsap.to(intro, {
      duration: 1,
      x: `${transX}vw`,
      ease: "power2.out"
    });
    
    gsap.to("#intro-scroll", {
      duration: .8,
      x: `${-transX - 100}vw`,
      rotation: "+=360",
      ease: "power2.out",
      delay: 0.2
    });

    // Scroll back to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  if (transX === -200) {
    disableScroll();
  } else {
    enableScroll();
  }
}

const phrase = "exoplanets";
const title = document.getElementById("title-hover");

phrase.split('').map((char, index) => {
    const el = document.createElement("span");

    el.innerHTML = char;
    el.setAttribute("data-index", index.toString());
    el.classList.add("hover-char");

    title.appendChild(el);
});

const hoverChars = [...document.getElementsByClassName("hover-char")];

const removeClasses = () => {
  hoverChars.map((char) => {
    char.classList.remove("title-hovered", "title-hovered-adjacent");
  })
}

hoverChars.map((char) => {
  char.addEventListener("mouseover", (e) => {
    removeClasses();
    const currentElement = e.target;
    const index = parseInt(currentElement.getAttribute("data-index"), 10);

    const prevIndex = index === 0 ? null : index - 1;
    const nextIndex = index === phrase.length - 1 ? null : index + 1;

    const prevElement = prevIndex !== null && document.querySelector(`[data-index="${prevIndex}"]`);
    const nextElement = nextIndex !== null && document.querySelector(`[data-index="${nextIndex}"]`);

    e.target.classList.add("title-hovered");
    prevElement && prevElement.classList.add("title-hovered-adjacent");
    nextElement && nextElement.classList.add("title-hovered-adjacent");
  })
});

document.getElementById("title-hover").addEventListener("mouseleave", () => {
  removeClasses();
});

// window.addEventListener('mousemove', function(e) {
//   document.documentElement.style.setProperty('--pointerX', e.clientX + 'px');
//   document.documentElement.style.setProperty('--pointerY', e.clientY + 'px');
// })

const inputs = ['planet-distance', 'habitable-center', 'habitable-range', 'temperature', 'atmosphere', 'water-availability', 'energy-source', 'metal-toxic'].map(id => document.getElementById(id));

function calculateAndPrintFormulas() {
    const [D, H, G, T, A, W, E, M] = inputs.map(input => parseFloat(input.value));
    const HDZ = (D - H) / G;
    console.log(`HDZ value: ${HDZ}`);
    const habitableIndex = Math.abs((T * A * W * E) / (M * Math.abs(HDZ))).toFixed(3);
    console.log(`Second formula value: ${habitableIndex}`);

    document.getElementById('habitable-index-value').textContent = Math.abs(habitableIndex).toFixed(3);

    // Get the habitable index result element
    const habitableIndexResult = document.querySelector('#habitable-index-result > div');

    // Calculate the habitable index value

    // Convert the habitable index to a value between 0 and 1
    const normalizedIndex = Math.min(Math.max(habitableIndex, 0), 1);

    // Calculate the color based on the normalized index
    // Define custom start and end colors (replace these with your desired hex codes)
    const startColor = '#FF0000';  // A shade of red
    const endColor = '#00FF00';    // A shade of green

    // Function to interpolate between two colors
    function interpolateColor(color1, color2, factor) {
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // Interpolate between start and end colors based on the normalized index
    const interpolatedColor = interpolateColor(startColor, endColor, normalizedIndex);

    // Set the background color
    habitableIndexResult.style.backgroundColor = interpolatedColor;
}

inputs.forEach(input => input.addEventListener('input', calculateAndPrintFormulas));

calculateAndPrintFormulas();

// Get all the radio buttons and planet images
const exoplanetTypeRadios = document.querySelectorAll('input[name="exoplanet-type"]');
const planetImages = document.querySelectorAll('#intro-scroll img');

// Function to update planet image opacity
function updatePlanetImage() {
    // Get the selected radio button value
    const selectedType = document.querySelector('input[name="exoplanet-type"]:checked').value;
    
    // Map of exoplanet types to image indices
    const typeToImageIndex = {
        'gas-giant': 1,
        'neptunian': 0,
        'super-earths': 3,
        'terrestrial': 2
    };
    
    // Set opacity for the selected image
    planetImages.forEach((img, index) => {
        if (index === typeToImageIndex[selectedType]) {
            gsap.to(img, { opacity: 1, duration: 0.5, ease: "power2.inOut" });
        } else {
            gsap.to(img, { opacity: 0, duration: 0.5, ease: "power2.inOut" });
        }
    });
}

// Add event listeners to radio buttons
exoplanetTypeRadios.forEach(radio => {
    radio.addEventListener('change', updatePlanetImage);
});

// Initial call to set the correct image on page load
updatePlanetImage();
