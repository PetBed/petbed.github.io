document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.timeline-item').forEach(item => {
    const content = item.querySelector('.timeline-content');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger:    item,
        start:      'center center',
        end:        '+=300%',
        scrub:      true,
        pin:        item,
        pinSpacing: true,
        // markers:    true,
      }
    });

    tl.fromTo(content,
      { scale: 0, opacity: 0 },
      { scale: 0, opacity: 1, ease: 'none' }
    )
    // 1) 0 → 3  (fast, easing out)
    tl.to(content, {
      scale:    .6,
      ease:     'power2.out',
      duration: 0.3,    // 25% of scroll stretch
    });

    // 2) 3 → 8  (slower, linear)
    tl.to(content, {
      scale:    1.5,
      ease:     'none',
      duration: 1,      // 50% of scroll stretch
    });

    // 3) 8 → 10 (fast, easing in)
    tl.to(content, {
      scale:    10,
      ease:     'power1.in',
      duration: 0.5,    // final 25% of scroll stretch
    });

    tl.to(content, { autoAlpha: 0, duration: 0.05 });
  });
});
