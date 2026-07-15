import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls, ContactShadows, Environment, Html, Lightformer } from '@react-three/drei';
import PlaneModel from './PlaneModel';
import InkReveal from './InkReveal';

export interface StudyRef {
  num: number;
  title: string;
  meta: string;
  url: string;
}
export interface PartData {
  id: string;
  label: string;
  anchor: [number, number, number];
  camera: [number, number, number];
  studies: StudyRef[];
}
interface Props {
  parts: PartData[];
  whole: { label: string; studies: StudyRef[] };
}

const HOME_POS: [number, number, number] = [6.8, 2.4, 7.2];
const HOME_TGT: [number, number, number] = [0, 0, -0.2];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const cb = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, []);
  return reduced;
}

function Scene({
  parts,
  active,
  hovered,
  setActive,
  setHovered,
  reduced,
}: {
  parts: PartData[];
  active: string | null;
  hovered: string | null;
  setActive: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  reduced: boolean;
}) {
  const controls = useRef<CameraControls>(null);
  const userMoved = useRef(false);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.smoothTime = 0.5;
    const part = parts.find((p) => p.id === active);
    if (part) {
      c.setLookAt(...part.camera, ...part.anchor, !reduced);
    } else {
      c.setLookAt(...HOME_POS, ...HOME_TGT, !reduced);
    }
  }, [active, parts, reduced]);

  // lente rotation d'inertie au repos, coupée dès que l'utilisateur orbite
  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || reduced || active || userMoved.current) return;
    c.azimuthAngle += delta * 0.06;
  });

  return (
    <>
      {/* studio procédural : softboxes → reflets sur la peinture vernie */}
      <Environment resolution={256}>
        <Lightformer intensity={3} rotation-x={Math.PI / 2} position={[0, 6, 0]} scale={[12, 12, 1]} />
        <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-7, 1.5, 0]} scale={[14, 3, 1]} />
        <Lightformer intensity={1.6} rotation-y={-Math.PI / 2} position={[7, 1.5, 0]} scale={[14, 3, 1]} />
        <Lightformer intensity={0.9} color="#FFE7D6" rotation-y={Math.PI} position={[0, 2, -8]} scale={[10, 4, 1]} />
        <Lightformer intensity={0.5} rotation-x={-Math.PI / 2} position={[0, -4, 0]} scale={[12, 12, 1]} />
      </Environment>
      <directionalLight position={[5, 8, 4]} intensity={0.8} />
      <ambientLight intensity={0.25} />
      <PlaneModel
        active={active}
        hovered={hovered}
        onHover={setHovered}
        onSelect={(id) => setActive(id === active ? null : id)}
      />
      {parts.map((p) => (
        <Html
          key={p.id}
          position={p.anchor}
          center
          zIndexRange={[30, 0]}
          wrapperClass="pv-hs-wrap"
        >
          <button
            type="button"
            className={`pv-hs${active === p.id ? ' is-active' : ''}`}
            aria-pressed={active === p.id}
            onClick={() => setActive(active === p.id ? null : p.id)}
            onPointerEnter={() => setHovered(p.id)}
            onPointerLeave={() => setHovered(null)}
          >
            <span className="pv-hs-square" aria-hidden="true" />
            <span className="pv-hs-id">
              {p.studies.map((s) => String(s.num).padStart(2, '0')).join('·')}
            </span>
            <span className="pv-hs-label">{p.label}</span>
          </button>
        </Html>
      ))}
      <ContactShadows position={[0, -1.15, 0]} scale={13} blur={2.6} far={3} opacity={0.28} />
      <CameraControls
        ref={controls}
        minDistance={4}
        maxDistance={13}
        maxPolarAngle={Math.PI * 0.72}
        onStart={() => {
          userMoved.current = true;
        }}
      />
    </>
  );
}

function CardStudies({ part }: { part: { label: string; studies: StudyRef[] } }) {
  return (
    <div className="pv-card-in">
      <p className="mono-label pv-card-kicker">
        Pièce inspectée — <span className="accent">{part.label}</span>
      </p>
      {part.studies.map((s) => (
        <article className="pv-study" key={s.num}>
          <span className="pv-study-num display" aria-hidden="true">
            {String(s.num).padStart(2, '0')}
          </span>
          <h3 className="pv-study-title display">{s.title}</h3>
          <p className="pv-study-meta mono-label">{s.meta}</p>
          <a className="pv-study-link mono-label" href={s.url}>
            Voir l'étude →
          </a>
        </article>
      ))}
    </div>
  );
}

export default function PlaneViewer({ parts, whole }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();
  const activePart = useMemo(() => parts.find((p) => p.id === active) ?? null, [active, parts]);

  return (
    <div className="pv-grid">
      {/* filtre encre partagé (bord organique du clip-path) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <filter id="ink-displace" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="26" />
        </filter>
      </svg>

      <figure className="pv-stage">
        <span className="pv-tick pv-tick-tl" aria-hidden="true" />
        <span className="pv-tick pv-tick-br" aria-hidden="true" />
        <Canvas
          camera={{ position: HOME_POS, fov: 32 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          onPointerMissed={(e) => {
            // ne pas annuler la sélection quand le clic vient de l'UI DOM
            // (hotspots, fiche, légende) — R3F déclenche « missed » pour
            // tout clic qui ne touche pas un mesh, même hors canvas
            const t = e.target as HTMLElement | null;
            if (t?.closest?.('.pv-hs, .pv-card')) return;
            setActive(null);
          }}
        >
          <Suspense fallback={null}>
            <Scene
              parts={parts}
              active={active}
              hovered={hovered}
              setActive={setActive}
              setHovered={setHovered}
              reduced={reduced}
            />
          </Suspense>
        </Canvas>
        <figcaption className="pv-caption mono-label">
          Fig. 00 — avion interactif · glisser pour orbiter · cliquer un repère
        </figcaption>
      </figure>

      <aside className="pv-card" aria-live="polite">
        {activePart ? (
          <InkReveal reveal={activePart.id} reduced={reduced}>
            <CardStudies part={activePart} />
          </InkReveal>
        ) : (
          <div className="pv-card-in pv-card-default">
            <p className="mono-label pv-card-kicker">Nomenclature — sélection</p>
            <p className="serif pv-card-hint">
              Chaque repère ancre une étude à la pièce qu'elle concerne. Cliquer un repère pour
              inspecter la pièce et ouvrir sa fiche.
            </p>
            <ul className="pv-legend" role="list">
              {parts.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="pv-legend-row mono-label"
                    onClick={() => setActive(p.id)}
                    onPointerEnter={() => setHovered(p.id)}
                    onPointerLeave={() => setHovered(null)}
                  >
                    <span className="accent">
                      {p.studies.map((s) => String(s.num).padStart(2, '0')).join('·')}
                    </span>
                    <span>{p.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            {whole.studies.map((s) => (
              <a className="pv-whole" key={s.num} href={s.url}>
                <span className="mono-label">
                  <span className="accent">{String(s.num).padStart(2, '0')}</span> — {whole.label}
                </span>
                <span className="pv-whole-title display">{s.title} →</span>
              </a>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
