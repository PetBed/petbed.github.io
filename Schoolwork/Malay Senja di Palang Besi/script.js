gsap.registerPlugin(ScrollTrigger);

// Select all maksud-section elements
const sections = document.querySelectorAll('.maksud-section');

// Apply animation to each section
sections.forEach((section, index) => {
  // Create timeline for smooth sequential animation
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 80%", 
      end: "top 45%",
      scrub: 1,  // Add scrub with a value of 1 for smooth scrolling
      markers: true,
    }
  });

  // Check if even numbered section
  const isEven = index % 2 === 1;
  
  tl.fromTo(section,
    {
      x: isEven ? "-100vw" : "100vw", // Mirror x position for even sections
      y: 50,
      rotation: isEven ? -10 : 10, // Mirror rotation for even sections
      opacity: 0,
      duration: 0
    },
    {
      y: 200
    }
  ).to(section, {
    x: 0,
    y: 0,
    opacity: 1,
    ease: "power2.out"
  })
  .to(section, {
    rotation: 0,
    ease: "back.out(1.7)"
  });
});

// Add this after your existing GSAP animations
const pengajaranSection = document.querySelector('.pengajaran-section');
const toggleButton = pengajaranSection.querySelector('i');

// Set initial position
gsap.set(pengajaranSection, {
  x: '90%'  // Start position off-screen
});

let isOpen = false;

toggleButton.addEventListener('click', () => {
  isOpen = !isOpen;
  
  gsap.to(toggleButton, {
    rotateY: isOpen ? 180 : 0,
    duration: 0.6,
    ease: "power2.inOut"
  });
  
  gsap.to(pengajaranSection, {
    x: isOpen ? '0%' : '90%',
    scale: isOpen ? 1 : 0.95,
    duration: 0.8,
    ease: "elastic.out(1, 0.8)",
    onComplete: () => {
      if (!isOpen) {
        iconAnimation.restart();
      }
    }
  });
});

const iconAnimation = gsap.timeline({repeat: -1})
  .to(toggleButton, {
    transform: 'translateX(-10px)',
    duration: 0.8,
    ease: "power1.inOut"
  })
  .to(toggleButton, {
    transform: 'translateX(0px)',
    duration: 0.8,
    ease: "power1.inOut"
  });

