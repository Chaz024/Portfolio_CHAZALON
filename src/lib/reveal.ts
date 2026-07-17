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

const EASE = [0.4, 0, 0.2, 1] as const;

function sample<T>(arr: T[], n: number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

export function initCurtain(): void {
  const c = document.querySelector<HTMLElement>('.curtain');
  if (!c || reduced()) return;
  const cols = Array.from(c.querySelectorAll<HTMLElement>('.curtain-cols span'));
  const stack = c.querySelector<HTMLElement>('.curtain-stack')!;
  const tag = c.querySelector<HTMLElement>('.curtain-tag')!;
  const covers: string[] = JSON.parse(c.dataset.covers || '[]');
  const indexPath = (c.dataset.indexPath || '').replace(/\/$/, '');
  covers.forEach((u) => { const im = new Image(); im.src = u; }); // préchargement

  // astro:page-load tire AUSSI au chargement initial (pas astro:before-preparation) :
  // sans ce garde, le rideau flasherait plein écran à chaque première visite.
  let entered = false;
  let mode: string = 'solid';
  let imgLayers: HTMLElement[] = [];
  let cover: Promise<unknown> = Promise.resolve();

  let sweepDir = 1;
  const sweepEl = c.querySelector<HTMLElement>('.curtain-sweep')!;

  document.addEventListener('astro:before-preparation', (e) => {
    entered = true;
    const ev = e as unknown as { to?: URL; loader?: () => Promise<unknown> };
    const to = (ev.to?.pathname || '').replace(/\/$/, '');
    
    // Pool of random transitions for non-index pages
    const transitions = ['solid', 'sweep', 'sweep-reverse', 'solid-down'];
    const randomTransition = transitions[Math.floor(Math.random() * transitions.length)];
    
    mode = to === indexPath && covers.length >= 3 ? 'image' : randomTransition;
    c.classList.toggle('is-image', mode === 'image');
    c.classList.toggle('is-solid', mode === 'solid' || mode === 'solid-down');
    c.classList.toggle('is-sweep', mode === 'sweep' || mode === 'sweep-reverse');

    if (mode === 'sweep' || mode === 'sweep-reverse') {
      sweepDir = mode === 'sweep' ? 1 : -1;
      sweepEl.style.transform = `translateX(${sweepDir * 101}%)`;
      cover = animate(sweepEl, { transform: 'translateX(0%)' }, { duration: 0.4, ease: EASE }).finished;
    } else if (mode === 'solid' || mode === 'solid-down') {
      const startY = mode === 'solid-down' ? '-101%' : '101%';
      cols.forEach((el) => { el.style.transform = `translateY(${startY})`; });
      cover = animate(
        cols,
        { transform: 'translateY(0%)' },
        { duration: 0.36, delay: stagger(0.05), ease: EASE },
      ).finished;
    } else {
      // chaque visuel MONTE par-dessus le précédent (superposition), et reste
      // affiché un moment avant que le suivant ne le recouvre → « calques »
      stack.querySelectorAll('.curtain-layer').forEach((n) => n.remove());
      imgLayers = sample(covers, 4).map((u) => {
        const s = document.createElement('span');
        s.className = 'curtain-layer';
        s.style.backgroundImage = `url("${u}")`;
        stack.appendChild(s);
        return s;
      });
      animate(tag, { opacity: [0, 1] }, { duration: 0.4, delay: 0.4 });
      // chaque calque monte par-dessus le précédent et reste ~0.6 s avant que
      // le suivant ne le recouvre (délais explicites : dwell fiable)
      const GAP = 0.22;
      let last = animate(imgLayers[0], { transform: ['translateY(101%)', 'translateY(0%)'] }, { duration: 0.3, ease: EASE });
      imgLayers.slice(1).forEach((el, i) => {
        last = animate(el, { transform: ['translateY(101%)', 'translateY(0%)'] }, { duration: 0.3, delay: GAP * (i + 1), ease: EASE });
      });
      cover = last.finished.then(() => new Promise((r) => setTimeout(r, 150))); // dwell final
    }

    // retenir la bascule du DOM tant que le rideau n'a pas couvert l'écran :
    // la page d'arrivée n'apparaît jamais en transparence pendant la montée.
    const orig = ev.loader;
    if (orig) ev.loader = async () => { await Promise.all([orig(), cover]); };
  });

  document.addEventListener('astro:page-load', () => {
    if (!entered) return;
    entered = false;
    // ne découvrir qu'une fois le rideau entièrement monté (chaque calque a eu
    // son temps d'affichage), même si la page d'arrivée est prête plus tôt.
    cover.then(() => {
      if (mode === 'sweep' || mode === 'sweep-reverse') {
        animate(sweepEl, { transform: `translateX(${-sweepDir * 101}%)` }, { duration: 0.4, ease: EASE });
      } else if (mode === 'solid' || mode === 'solid-down') {
        const endY = mode === 'solid-down' ? '101%' : '-101%';
        animate(cols, { transform: `translateY(${endY})` }, { duration: 0.42, delay: stagger(0.05), ease: EASE })
          .finished.then(() => { cols.forEach((el) => { el.style.transform = 'translateY(101%)'; }); });
      } else {
        animate(tag, { opacity: 0 }, { duration: 0.2 });
        animate(imgLayers, { transform: 'translateY(-101%)' }, { duration: 0.4, delay: stagger(0.04), ease: EASE })
          .finished.then(() => {
            stack.querySelectorAll('.curtain-layer').forEach((n) => n.remove());
            imgLayers = [];
          });
      }
    });
  });
}
