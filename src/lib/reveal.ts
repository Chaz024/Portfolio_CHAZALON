import { animate, inView, stagger } from 'motion';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initMotion(): void {
  if (reduced()) return; // tout reste visible par défaut (aucun état initial caché en CSS)
  document.querySelectorAll<HTMLElement>('[data-reveal-lines]').forEach((el) => {
    const spans = el.querySelectorAll<HTMLElement>('.line > span');
    animate(spans, { y: ['110%', '0%'] }, { duration: 0.55, delay: stagger(0.07), ease: [0.22, 1, 0.36, 1] });
  });
  document.querySelectorAll<HTMLElement>('[data-plate]').forEach((el) => {
    el.style.opacity = '0';
    inView(el, () => { animate(el, { opacity: [0, 1], y: [24, 0] }, { duration: 0.4, ease: 'easeOut' }); }, { amount: 0.25 });
  });
  document.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => {
    const target = Number(el.dataset.counter ?? '0');
    animate(0, target, { duration: 0.9, ease: 'easeOut', onUpdate: (v) => { el.textContent = String(Math.round(v)); } });
  });
}

export function initCurtain(): void {
  const c = document.querySelector<HTMLElement>('.curtain');
  if (!c || reduced()) return;
  document.addEventListener('astro:before-preparation', () => {
    animate(c, { transform: ['translateY(101%)', 'translateY(0%)'] }, { duration: 0.28, ease: [0.4, 0, 0.2, 1] });
  });
  document.addEventListener('astro:page-load', () => {
    animate(c, { transform: ['translateY(0%)', 'translateY(-101%)'] }, { duration: 0.32, ease: [0.4, 0, 0.2, 1] })
      .finished.then(() => { c.style.transform = 'translateY(101%)'; });
  });
}
