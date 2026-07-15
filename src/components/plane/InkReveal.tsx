import { useEffect, useRef, useState, type ReactNode } from 'react';

/* Révélation « encre » (façon 21st.dev / ink-reveal) :
   la fiche est recouverte d'un lavis d'encre peint sur un <canvas>.
   On l'ESSUIE au curseur — chaque passage efface des tampons d'encre
   organiques (destination-out, bords irréguliers) et découvre l'étude
   dessous, comme on essuie une plaque d'impression encore fraîche.
   Sécurité UX : si on n'y touche pas, l'encre se dissout seule après
   un court délai (tactile / prefers-reduced-motion / découvrabilité). */

const AUTO_DELAY = 1400; // ms avant dissolution automatique si intact
const AUTO_DURATION = 1100; // ms de la dissolution automatique

function readInk(el: HTMLElement): string {
  const v = getComputedStyle(el).getPropertyValue('--accent').trim();
  return v || '#c8452d';
}

export default function InkReveal({
  children,
  reveal,
  reduced,
}: {
  children: ReactNode;
  /** change de valeur pour rejouer la révélation */
  reveal: string;
  reduced: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduced) {
      setDone(true);
      return;
    }
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDone(true);
      return;
    }

    setDone(false);
    let raf = 0;
    let autoTimer = 0;
    let touched = false;
    let finished = false;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const ink = readInk(wrap);

    function paintInk() {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      // lavis d'encre + grain d'impression
      ctx.fillStyle = ink;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#000';
      for (let i = 0; i < (w * h) / 900; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillRect(x, y, 1.2, 1.2);
      }
      ctx.globalAlpha = 1;
    }

    // un tampon d'encre organique effacé (bord flou + irrégulier)
    function stamp(x: number, y: number, r: number) {
      ctx.globalCompositeOperation = 'destination-out';
      const blobs = 5;
      for (let i = 0; i < blobs; i++) {
        const a = (i / blobs) * Math.PI * 2 + Math.random();
        const d = Math.random() * r * 0.5;
        const bx = x + Math.cos(a) * d;
        const by = y + Math.sin(a) * d;
        const br = r * (0.55 + Math.random() * 0.5);
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(0.6, 'rgba(0,0,0,0.85)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // trace continue entre deux points (comble les trous du pointermove)
    function wipe(x0: number, y0: number, x1: number, y1: number, r: number) {
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.floor(dist / (r * 0.35)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r);
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(autoTimer);
      setDone(true); // la couche encre s'estompe (transition CSS) puis se retire
    }

    // dissolution automatique : vagues de tampons couvrant tout le cadre
    function autoDissolve() {
      if (touched || finished) return;
      const start = performance.now();
      const R = Math.hypot(w, h);
      const cx = w * 0.28;
      const cy = h * 0.22; // départ vers le coin haut-gauche, comme un coup de brosse
      function step(now: number) {
        const t = Math.min(1, (now - start) / AUTO_DURATION);
        const reach = t * R * 1.15;
        const ring = R * 0.14;
        for (let k = 0; k < 26; k++) {
          const ang = Math.random() * Math.PI * 2;
          const rad = reach - Math.random() * ring;
          if (rad < 0) continue;
          stamp(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * 0.85, 26);
        }
        if (t < 1 && !touched) {
          raf = requestAnimationFrame(step);
        } else if (!touched) {
          finish();
        }
      }
      raf = requestAnimationFrame(step);
    }

    let last: { x: number; y: number } | null = null;
    function pointFromEvent(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onDown(e: PointerEvent) {
      touched = true;
      window.clearTimeout(autoTimer);
      cancelAnimationFrame(raf);
      canvas.setPointerCapture?.(e.pointerId);
      last = pointFromEvent(e);
      stamp(last.x, last.y, 34);
    }
    function onMove(e: PointerEvent) {
      const p = pointFromEvent(e);
      if (!touched) {
        // survol simple avant appui : on efface aussi, l'effet répond au geste
        if (last) wipe(last.x, last.y, p.x, p.y, 30);
        last = p;
        return;
      }
      if (last) wipe(last.x, last.y, p.x, p.y, 34);
      last = p;
      // fin dès que l'essuyage a suffisamment découvert la fiche
      if (erasedEnough()) finish();
    }
    function onUp() {
      last = null;
      if (touched && erasedEnough()) finish();
    }

    // échantillonne l'alpha restant sur une grille grossière
    let sampleCache = 0;
    let sampleAt = 0;
    function erasedEnough() {
      const now = performance.now();
      if (now - sampleAt < 120) return sampleCache > 0.82;
      sampleAt = now;
      const gx = 12;
      const gy = 16;
      let clear = 0;
      let n = 0;
      for (let i = 1; i < gx; i++) {
        for (let j = 1; j < gy; j++) {
          const px = Math.round((canvas.width * i) / gx);
          const py = Math.round((canvas.height * j) / gy);
          const a = ctx.getImageData(px, py, 1, 1).data[3];
          if (a < 40) clear++;
          n++;
        }
      }
      sampleCache = clear / n;
      return sampleCache > 0.82;
    }

    paintInk();
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    autoTimer = window.setTimeout(autoDissolve, AUTO_DELAY);

    const ro = new ResizeObserver(() => {
      if (finished) return;
      // repeindre proprement si le cadre change de taille avant la fin
      paintInk();
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(autoTimer);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      ro.disconnect();
    };
  }, [reveal, reduced]);

  return (
    <div className="ink-wrap" ref={wrapRef}>
      <div className="ink-content">{children}</div>
      {!reduced && (
        <>
          <canvas
            ref={canvasRef}
            className={`ink-canvas${done ? ' is-done' : ''}`}
            aria-hidden="true"
          />
          {!done && (
            <span className="ink-hint mono-label" aria-hidden="true">
              Essuyez l'encre ↴
            </span>
          )}
        </>
      )}
    </div>
  );
}
