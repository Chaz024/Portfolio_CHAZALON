import { areaRatio, machFromAreaRatio, plasma } from './nozzle-math';

const THROAT_X = 0.45; // position du col (fraction de largeur)
export class NozzleSim {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private parts: { x: number; y: number }[] = [];
  private w = 0;
  private h = 0;
  Me = 2.2;
  constructor(private canvas: HTMLCanvasElement, private n = 900) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    for (let i = 0; i < n; i++) this.parts.push({ x: Math.random(), y: Math.random() * 2 - 1 });
  }
  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = this.canvas.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.canvas.width = r.width * dpr; this.canvas.height = r.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  /** demi-hauteur du canal en x∈[0,1], 1 = demi-hauteur d'entrée */
  private wall(x: number): number {
    const rIn = 1, rTh = 0.42, rOut = 0.42 * Math.sqrt(areaRatio(this.Me));
    return x < THROAT_X
      ? rTh + (rIn - rTh) * 0.5 * (1 + Math.cos((Math.PI * x) / THROAT_X))
      : rTh + (rOut - rTh) * 0.5 * (1 - Math.cos((Math.PI * (x - THROAT_X)) / (1 - THROAT_X)));
  }
  private machAt(x: number): number {
    const ratio = (this.wall(x) / 0.42) ** 2; // axisymétrique : aire ∝ rayon²
    return machFromAreaRatio(ratio, x < THROAT_X ? 'sub' : 'sup');
  }
  private frame(): void {
    const { ctx, w, h } = this;
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    // parois
    ctx.strokeStyle = '#0A0A0A'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (const s of [1, -1]) {
      ctx.moveTo(0, h / 2 + s * this.wall(0) * h * 0.46);
      for (let x = 0; x <= 1.001; x += 0.02) ctx.lineTo(x * w, h / 2 + s * this.wall(x) * h * 0.46);
    }
    ctx.stroke();
    const mMax = Math.max(this.Me, 1.2);
    for (const p of this.parts) {
      const m = this.machAt(p.x);
      p.x += 0.0016 * (0.25 + m); // vitesse ∝ Mach (stylisé)
      if (p.x >= 1) { p.x = 0; p.y = Math.random() * 2 - 1; }
      const yy = h / 2 + p.y * this.wall(p.x) * h * 0.44;
      const [r, g, b] = plasma(m / mMax);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(p.x * w, yy, 2.2, 2.2);
    }
  }
  start() {
    const step = () => {
      this.frame();
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  renderFrame(): void { this.frame(); }
  stop() { cancelAnimationFrame(this.raf); }
}
