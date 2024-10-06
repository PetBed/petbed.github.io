const inputs = ['planet-distance', 'habitable-center', 'habitable-range', 'temperature', 'atmosphere', 'water-availability', 'energy-source', 'metal-toxic'].map(id => document.getElementById(id));

function calculateAndPrintFormulas() {
    const [D, H, G, T, A, W, E, M] = inputs.map(input => parseFloat(input.value));
    const HDZ = (D - H) / G;
    console.log(`HDZ value: ${HDZ}`);
    console.log(`Second formula value: ${(T * A * W * E) / (M * Math.abs(HDZ))}`);
}

inputs.forEach(input => input.addEventListener('input', calculateAndPrintFormulas));

calculateAndPrintFormulas();

const planetTypes = {
  // "Terrestrial": {
  //   mass: [1.9, 4.7],
  //   radius: [.5, 2], 
  //   surface: ["Rocky", "Volcanic"],
  //   atmosphere: ["Thin", "CO2-rich", "N2-rich", "O2-rich"],
  //   temperature: [-225, 464]
  // },
  // "Ice Giant": {
  //   mass: [10, 80],
  //   radius: [2, 6],
  //   surface: ["Ice"],
  //   atmosphere: ["He-rich", "Methane-rich"],
  //   temperature: [-230 °C]
  // },
  // "Gas Giant": {
  //   mass: [0.36,13.6 Jupiter mass],
  //   radius: [1.7,3.9],
  //   surface: ["No solid surface"],
  //   atmosphere: ["H2-rich", "He-rich", "Methane-rich"],
  //   temperature: [< -120°C]
  // },
  // "Super-Earth": {
  //   mass: [2,10],
  //   radius: [1.25,2],
  //   surface: ["Rocky", "Ocean"],
  //   atmosphere: ["Thin", "Thick", "CO2-rich", "N2-rich", "H2-rich", "O2-rich"],
  //   temperature: [<2300°C]
  // },
  // "Ocean Planet": {
  //   mass: [1,10],
  //   radius: [1,3],
  //   surface: ["Global ocean"],
  //   atmosphere: [ "CO2-rich"],
  //   temperature: [-100°C,100°C]
  // }
  "Terrestrial": {
    mass: [0.1, 2],
    radius: [0.5, 1.5],
    surface: ["Rocky", "Volcanic", "Desert", "Ice-covered", "Partially molten"],
    atmosphere: ["Thin", "CO2-rich", "N2-rich", "O2-rich", "Trace"],
    temperature: [-50, 100]
  },
  "Ice Giant": {
    mass: [10, 50],
    radius: [3, 5],
    surface: ["Ice", "Liquid metallic", "Supercritical fluid", "Rocky core"],
    atmosphere: ["H2-rich", "He-rich", "Methane-rich", "Ammonia-rich", "Water vapor-rich"],
    temperature: [-220, -100]
  },
  "Gas Giant": {
    mass: [50, 5000],
    radius: [5, 20],
    surface: ["No solid surface", "Liquid metallic hydrogen", "Rocky core", "Ice core"],
    atmosphere: ["H2-rich", "He-rich", "Methane-rich", "Ammonia-rich", "Water vapor-rich"],
    temperature: [-150, 600]
  },
  "Super-Earth": {
    mass: [2, 10],
    radius: [1.25, 2],
    surface: ["Rocky", "Ocean", "Ice-covered", "Desert", "Volcanic", "Partially molten"],
    atmosphere: ["Thin", "Thick", "CO2-rich", "N2-rich", "H2-rich", "O2-rich"],
    temperature: [-50, 200]
  },
  "Ocean Planet": {
    mass: [1, 10],
    radius: [1.5, 2.5],
    surface: ["Global ocean", "Partial ocean", "Ice-covered ocean", "Rocky core with ocean layer"],
    atmosphere: ["Water vapor-rich", "CO2-rich", "N2-rich", "Thin", "Thick"],
    temperature: [-20, 100]
  }
};

function generateExoplanet() {
  const types = Object.keys(planetTypes);
  const type = types[Math.floor(Math.random() * types.length)];
  const properties = planetTypes[type];

  const randomInRange = (min, max) => Math.random() * (max - min) + min;
  const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

  return {
    type: type,
    mass: randomInRange(...properties.mass).toFixed(2),
    radius: randomInRange(...properties.radius).toFixed(2),
    surface: randomElement(properties.surface),
    atmosphere: randomElement(properties.atmosphere),
    temperature: Math.round(randomInRange(...properties.temperature))
  };
}

console.log(generateExoplanet());