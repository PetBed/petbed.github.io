gsap.registerPlugin(ScrollTrigger);

// Select all sajak-content elements
const sections = document.querySelectorAll('.sajak-content');
const maksudContents = document.querySelectorAll('.maksud-content');
const pengajaranContents = document.querySelectorAll('.pengajaran-item');

// Apply animation to each section
sections.forEach((section, index) => {
  // Create timeline for smooth sequential animation
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 50%", 
      end: "top 50%",
      scrub: 1,  // Add scrub with a value of 1 for smooth scrolling
      // markers: true,
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

// Add animation for maksud-content elements
if (window.innerWidth > 426) {
  let offset = 0;
  maksudContents.forEach((content, index) => {
    const contentPos = content.getBoundingClientRect();
    console.log(contentPos)
    const animation = gsap.timeline({
      scrollTrigger: {
        trigger: content,
        start: "top 50%",
        end: "top 50%",
        toggleActions: "play none none reverse",
        // markers: true,
      }
    });

    animation.fromTo(content,
      {
        x: `-${contentPos.left + 600}px`, // Start right at the edge of the left side of the viewport, out of frame
        y: `${30 * offset}em`,
        rotation: -3,
        duration: 0
      },
      {
        y: 0,
      })
      .to(content, {
        x: 0,
        opacity: 1,
        duration: .5,
        ease: "none",
      })
      .to(content, {
        rotation: "+=6",
        yoyo: true,
        repeat: 10,
        duration: 0.1,
        ease: "none"
      }, 0) // Start at the same time
      .to(content, {
        rotation: 0,
        duration: 0.1,
        ease: "none"
      }); // End with rotation being 0
    offset++;
  });
}

offset = 0;
pengajaranContents.forEach((content, index) => {
  const contentPos = content.getBoundingClientRect();
  console.log(contentPos)
  const animation = gsap.timeline({
    scrollTrigger: {
      trigger: content,
      start: `top ${50 - 30 * offset}%`,
      end: "top 50%",
      toggleActions: "play none none reverse",
      // markers: true,
    }
  });

  animation.fromTo(content,
    {
      x: `${contentPos.left + content.offsetWidth * .7}px`, // Start right at the edge of the left side of the viewport, out of frame
      // y: `${10 * offset}em`,
      duration: 0,
    },
    {
      // y: 0,
    })
    .to(content, {
      x: 0,
      opacity: 1,
      duration: .5,
      ease: "none",
    });
  offset++;
});
