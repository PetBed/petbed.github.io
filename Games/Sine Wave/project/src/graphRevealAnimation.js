import gsap from 'gsap';

/** Fluorescent tube power-on: quick flickers, then steady glow. */
export function animateGraphFlickerIn(targetEl) {
  if (!targetEl) return null;

  gsap.killTweensOf(targetEl);

  gsap.set(targetEl, {
    opacity: 0,
    filter: 'brightness(4) saturate(0.15)',
    boxShadow: '0 0 0px rgba(107, 143, 113, 0)',
  });

  return gsap.timeline({ defaults: { ease: 'none' } })
    .to(targetEl, { opacity: 0.1, duration: 0.04 })
    .to(targetEl, { opacity: 0.02, duration: 0.03 })
    .to(targetEl, {
      opacity: 0.3,
      duration: 0.05,
      boxShadow: '0 0 14px rgba(107, 143, 113, 0.4)',
    })
    .to(targetEl, { opacity: 0.05, duration: 0.04 })
    .to(targetEl, {
      opacity: 0.55,
      duration: 0.07,
      filter: 'brightness(2.6) saturate(0.85)',
      boxShadow: '0 0 28px rgba(107, 143, 113, 0.6)',
    })
    .to(targetEl, { opacity: 0.15, duration: 0.04 })
    .to(targetEl, {
      opacity: 0.82,
      duration: 0.08,
      filter: 'brightness(1.7) saturate(1.05)',
    })
    .to(targetEl, { opacity: 0.4, duration: 0.05 })
    .to(targetEl, {
      opacity: 1,
      duration: 0.2,
      filter: 'brightness(1) saturate(1)',
      boxShadow: '0 0 10px rgba(107, 143, 113, 0.12)',
      ease: 'power2.out',
    });
}
