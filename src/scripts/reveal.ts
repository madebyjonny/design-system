/**
 * Progressive enhancement shared by every page:
 *  - scroll-triggered reveals
 *  - sticky nav state
 *  - a single rAF-driven scroll loop for cinematic sections
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------- reveals --- */
export function initReveals(root: ParentNode = document) {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!targets.length) return;

  if (reduced.matches || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
  );

  targets.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------ scroll fx --- */
type ScrollFx = (info: { y: number; vh: number }) => void;
const fx = new Set<ScrollFx>();
let scheduled = false;

function tick() {
  scheduled = false;
  const info = { y: window.scrollY, vh: window.innerHeight };
  fx.forEach((fn) => fn(info));
  document.documentElement.toggleAttribute('data-scrolled', info.y > 12);
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(tick);
}

export function onScroll(fn: ScrollFx) {
  fx.add(fn);
  fn({ y: window.scrollY, vh: window.innerHeight });
  return () => fx.delete(fn);
}

export function initScrollLoop() {
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
}

/* ------------------------------------------------------- count-up numbers -- */
export function initCounters(root: ParentNode = document) {
  const counters = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'));
  if (!counters.length) return;

  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.count ?? 0);
    const decimals = Number(el.dataset.countDecimals ?? 0);
    const suffix = el.dataset.countSuffix ?? '';
    const prefix = el.dataset.countPrefix ?? '';
    if (reduced.matches) {
      el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = `${prefix}${(target * eased).toFixed(decimals)}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(run);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        run(entry.target as HTMLElement);
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.4 },
  );
  counters.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------------- boot ----- */
export function boot() {
  initReveals();
  initCounters();
  initScrollLoop();
}
