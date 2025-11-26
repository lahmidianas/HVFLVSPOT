/**
 * Intersection Observer utility for fade-in animations
 */
export function createFadeInObserver(
  callback?: (entry: IntersectionObserverEntry) => void
): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (callback) {
            callback(entry);
          }
          // Unobserve after animation to improve performance
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  return observer;
}

/**
 * Add fade-in animation to elements
 */
export function addFadeInAnimation(elements: NodeListOf<Element> | Element[]) {
  if (typeof window === 'undefined') return;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const observer = createFadeInObserver();

  elements.forEach((element, index) => {
    // Add initial state
    element.classList.add('fade-in-observer');
    
    // Stagger animations slightly
    (element as HTMLElement).style.animationDelay = `${index * 0.1}s`;
    
    // Observe element
    observer.observe(element);
  });
}

/**
 * Add page transition effects
 */
export function addPageTransition(element: HTMLElement) {
  if (typeof window === 'undefined') return;
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  element.classList.add('page-transition', 'page-enter');
  
  // Trigger animation
  requestAnimationFrame(() => {
    element.classList.remove('page-enter');
    element.classList.add('page-enter-active');
  });
}

/**
 * Add CTA button pulse effect
 */
export function addCTAPulse(button: HTMLElement) {
  if (typeof window === 'undefined') return;
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  button.classList.add('cta-pulse');
}

/**
 * Staggered animation utility
 */
export function staggerAnimation(
  elements: NodeListOf<Element> | Element[],
  animationClass: string,
  delay: number = 100
) {
  if (typeof window === 'undefined') return;
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add(animationClass);
    }, index * delay);
  });
}