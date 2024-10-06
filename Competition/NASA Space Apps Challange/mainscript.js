const selectPlanetBody = planet => {
  console.log(planet);
  const main = document.querySelector('main');
  document.querySelectorAll('.planet-info').forEach(el => el.style.display = 'none');
  const info = document.getElementById(`planet-info-${planet}`);
  if (info) info.style.display = 'grid';
  main.style.display = 'grid';
  main.animate([{opacity: 0}, {opacity: 1}], {duration: 500, easing: 'ease-in-out', fill: 'forwards'}).onfinish = () => main.style.opacity = '1';

  const planetName = document.getElementById('planet-name');
  const selectedPlanetInfo = document.querySelector('.planet-info[style="display: grid;"]');
  const targetElement = selectedPlanetInfo.querySelector('.planet-name-target');
  const targetRect = targetElement.getBoundingClientRect();
  
  gsap.to(planetName, {
    top: (targetRect.top + targetRect.height / 2 - 40) + 'px', // Offset up by 20 pixels
    left: (targetRect.left + targetRect.width / 2) + 'px',
    xPercent: -50,
    yPercent: -50,
    fontSize: '2.4rem',
    duration: 1,
    ease: 'power2.inOut'
  });
}

const back = () => {
  const main = document.querySelector('main');
  main.animate([{opacity: 1}, {opacity: 0}], {duration: 500, fill: 'forwards'}).onfinish = () => {
    main.style.display = 'none';
    document.querySelectorAll('.planet-info').forEach(el => el.style.display = 'none');
  };
  // if (selectedPlanet) deselectPlanet(selectedPlanet);
  if (selectedPlanet) {
    gsap.to(selectedPlanet.mesh.scale, {
      x: 4.3,
      y: 4.3,
      z: 4.3,
      duration: 0.5,
      ease: "power2.out"
    });
  }
  const planetName = document.getElementById('planet-name');
  gsap.to(planetName, {
    top: '10%',
    left: '50%',
    transform: 'translate(-50%, 0)',
    fontSize: '100px',
    duration: 1,
    ease: 'power2.inOut'
  });
}

// const loader = new THREE.ObjectLoader();
// loader.load(
// 	// resource URL
// 	"./model.json",

// 	// onLoad callback
// 	// Here the loaded data is assumed to be an object
// 	function ( obj ) {
// 		// Add the loaded object to the scene
// 		scene.add( obj );
// 	},

// 	// onProgress callback
// 	function ( xhr ) {
// 		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
// 	},

// 	// onError callback
// 	function ( err ) {
// 		console.error( 'An error happened' );
// 	}
// );

// import * as THREE from 'three'
// import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

// const loader = new GLTFLoader();

// loader.load( 'path/to/model.glb', function ( gltf ) {

// 	scene.add( gltf.scene );

// }, undefined, function ( error ) {

// 	console.error( error );

// } );