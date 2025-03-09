// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Hide all content initially with transform
// gsap.set('.bunyi-content', {
//   xPercent: 100,
//   display: 'none'
// });

// Hide all arrows initially
// gsap.set('.arrow-indicator', {
//   opacity: 0,
//   x: 10
// });

// Show initial checked content and arrow
// const initialContent = document.querySelector('input[type="radio"]:checked + .bunyi-content');
// const initialArrow = document.querySelector(`label[for="${document.querySelector('input[type="radio"]:checked').id}"] .arrow-indicator`);
// const sidebar = document.querySelector('.bunyi-sidebar');

// if (initialContent) {
//   gsap.set(initialContent, { display: 'block' });
//   gsap.to(initialContent, {
//     xPercent: 0,
//     duration: 0.5,
//     ease: 'power2.out'
//   });
  
//   // Show initial arrow
//   gsap.to(initialArrow, {
//     opacity: 1,
//     x: 0,
//     duration: 0.3,
//     ease: 'power2.out'
//   });
// }

// // Add click event listeners to radio buttons
// document.querySelectorAll('.bunyi-container input[type="radio"]').forEach(radio => {
//   radio.addEventListener('change', function() {
//     // If animation is running, ignore the click
//     if (sidebar.classList.contains('busy')) return;
    
//     // Add busy class to prevent clicks
//     sidebar.classList.add('busy');
    
//     const selectedContent = this.nextElementSibling;
//     const currentlyVisible = document.querySelector('.bunyi-content[style*="display: block"]');
    
//     // Hide all arrows first
//     gsap.to('.arrow-indicator', {
//       opacity: 0,
//       x: 10,
//       duration: 0.3,
//       ease: 'power2.in'
//     });

//     // Show selected arrow
//     const selectedArrow = document.querySelector(`label[for="${this.id}"] .arrow-indicator`);
//     gsap.to(selectedArrow, {
//       opacity: 1,
//       x: 0,
//       duration: 0.3,
//       ease: 'power2.out'
//     });

//     // Create a timeline for the sequence
//     const tl = gsap.timeline({
//       onComplete: () => {
//         // Remove busy class when animation completes
//         sidebar.classList.remove('busy');
//       }
//     });

//     // If there's visible content, hide it first
//     if (currentlyVisible && currentlyVisible !== selectedContent) {
//       tl.to(currentlyVisible, {
//         xPercent: 100,
//         duration: 0.3,
//         ease: 'power2.in',
//         onComplete: () => gsap.set(currentlyVisible, { display: 'none' })
//       });
//     }

//     // Then show the new content
//     tl.set(selectedContent, { display: 'block' })
//       .to(selectedContent, {
//         xPercent: 0,
//         duration: 0.5,
//         ease: 'power2.out'
//       });
//   });
// });

// Flip card animation
const cards = document.querySelectorAll('.flip-card-inner');

// Initialize all cards
// gsap.set(cards, {
//   rotationY: 0
// });

// // Add change event listeners to all card checkboxes
// document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
//   checkbox.addEventListener('change', function() {
//     // Get the corresponding card for this checkbox
//     const card = cards[index];
    
//     if (this.checked) {
//       gsap.to(card, {
//         rotationY: 180,
//         duration: 0.8,
//         ease: "power1.inOut"
//       });
//     } else {
//       gsap.to(card, {
//         rotationY: 0,
//         duration: 0.8,
//         ease: "power1.inOut"
//       });
//     }
//   });
// });
