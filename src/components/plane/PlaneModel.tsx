import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';

/* Avion de ligne procédural, style maquette de bureau d'études :
   fuselage profilé (lathe), voilure en flèche avec dièdre et winglets,
   bande hublots + cheatline, réacteurs profilés. Chaque pièce
   interactive porte un id (nacelle, aile, empennage, ecs, moteur). */

const BASE = '#EDEBE0';
const HULL = '#F4F2E9';
const HOVER = '#FFD9C2';
const ACTIVE = '#FF4F00';
const DARK = '#1c1c1c';
const EDGE = '#141414';
const DIHEDRAL = 0.1;

interface PartProps {
  active: string | null;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

function colorFor(id: string, active: string | null, hovered: string | null, base = BASE) {
  if (active === id) return ACTIVE;
  if (hovered === id) return HOVER;
  return base;
}

function partHandlers(id: string, p: PartProps) {
  return {
    onPointerOver: (e: any) => {
      e.stopPropagation();
      p.onHover(id);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      p.onHover(null);
      document.body.style.cursor = '';
    },
    onClick: (e: any) => {
      e.stopPropagation();
      p.onSelect(id);
    },
  };
}

/* Coque du fuselage : profil de révolution, nez pointu, queue effilée */
function useHullGeometry() {
  return useMemo(() => {
    // points ordonnés en y croissant (queue → nez) : normales vers l'extérieur
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0.001, -4.0),
      new THREE.Vector2(0.05, -3.92),
      new THREE.Vector2(0.14, -3.55),
      new THREE.Vector2(0.28, -2.9),
      new THREE.Vector2(0.4, -2.2),
      new THREE.Vector2(0.45, -1.5),
      new THREE.Vector2(0.45, 1.2),
      new THREE.Vector2(0.435, 1.85),
      new THREE.Vector2(0.37, 2.36),
      new THREE.Vector2(0.26, 2.76),
      new THREE.Vector2(0.13, 3.06),
      new THREE.Vector2(0.001, 3.3),
    ];
    return new THREE.LatheGeometry(pts, 44);
  }, []);
}

/* Voilure en flèche avec cassure de bord de fuite (yehudi) */
function useWingGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.3, 1.0);
    s.lineTo(3.3, -0.65);
    s.lineTo(3.3, -1.02);
    s.lineTo(1.2, -0.95);
    s.lineTo(0.3, -0.95);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.055, bevelEnabled: false });
  }, []);
}

function useWingletGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0.42, 0);
    s.lineTo(0.44, 0.42);
    s.lineTo(0.3, 0.42);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false });
  }, []);
}

function useStabGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.1, 0.45);
    s.lineTo(1.55, -0.25);
    s.lineTo(1.55, -0.55);
    s.lineTo(0.1, -0.4);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false });
  }, []);
}

function useFinGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(1.6, 0);
    s.lineTo(1.5, 1.3);
    s.lineTo(0.95, 1.3);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.055, bevelEnabled: false });
  }, []);
}

/* Nacelle de réacteur : capot profilé (lathe), soufflante sombre, cône */
function usePodGeometry() {
  return useMemo(() => {
    const pts: THREE.Vector2[] = [
      new THREE.Vector2(0.13, -0.72),
      new THREE.Vector2(0.15, -0.6),
      new THREE.Vector2(0.24, -0.36),
      new THREE.Vector2(0.3, -0.08),
      new THREE.Vector2(0.3, 0.32),
      new THREE.Vector2(0.26, 0.52),
    ];
    return new THREE.LatheGeometry(pts, 28);
  }, []);
}

function Engine({ side, id, p, pod }: { side: 1 | -1; id: string; p: PartProps; pod: THREE.LatheGeometry }) {
  const color = colorFor(id, p.active, p.hovered);
  const h = partHandlers(id, p);
  return (
    <group position={[1.32 * side, -0.36, 0.5]} {...h}>
      <mesh geometry={pod} rotation-x={Math.PI / 2}>
        <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* soufflante + cône */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.47]}>
        <circleGeometry args={[0.25, 28]} />
        <meshStandardMaterial color={DARK} roughness={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0.47]}>
        <coneGeometry args={[0.07, 0.14, 16]} />
        <meshStandardMaterial color={HULL} roughness={0.8} />
      </mesh>
      {/* tuyère primaire */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0.02, -0.84]}>
        <cylinderGeometry args={[0.12, 0.07, 0.26, 20]} />
        <meshStandardMaterial color={DARK} roughness={0.6} />
      </mesh>
      {/* mât */}
      <mesh position={[0, 0.3, -0.12]} rotation-x={0.25}>
        <boxGeometry args={[0.06, 0.34, 0.55]} />
        <meshStandardMaterial color={BASE} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Wing({
  side,
  geo,
  winglet,
  color,
  handlers,
}: {
  side: 1 | -1;
  geo: THREE.ExtrudeGeometry;
  winglet: THREE.ExtrudeGeometry;
  color: string;
  handlers: ReturnType<typeof partHandlers>;
}) {
  return (
    <group scale={[side, 1, 1]}>
      <group rotation-z={DIHEDRAL} {...handlers}>
        <mesh geometry={geo} rotation-x={Math.PI / 2} position={[0, -0.16, 0]}>
          <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
          <Edges color={EDGE} threshold={20} />
        </mesh>
        {/* winglet incliné vers l'extérieur */}
        <mesh
          geometry={winglet}
          rotation={[0, Math.PI / 2, -0.35]}
          position={[3.24, -0.14, -0.62]}
        >
          <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
          <Edges color={EDGE} threshold={20} />
        </mesh>
      </group>
    </group>
  );
}

export default function PlaneModel(p: PartProps) {
  const hull = useHullGeometry();
  const wing = useWingGeometry();
  const winglet = useWingletGeometry();
  const stab = useStabGeometry();
  const fin = useFinGeometry();
  const pod = usePodGeometry();

  const wingColor = colorFor('aile', p.active, p.hovered);
  const empColor = colorFor('empennage', p.active, p.hovered);
  const ecsColor = colorFor('ecs', p.active, p.hovered, '#E6E4D8');
  const wingH = partHandlers('aile', p);
  const empH = partHandlers('empennage', p);
  const ecsH = partHandlers('ecs', p);

  return (
    <group>
      {/* fuselage */}
      <mesh geometry={hull} rotation-x={Math.PI / 2}>
        <meshStandardMaterial color={HULL} roughness={0.88} />
      </mesh>
      {/* bande hublots + cheatline orange */}
      <mesh position={[0, 0.14, 0.15]}>
        <boxGeometry args={[0.905, 0.045, 3.4]} />
        <meshStandardMaterial color={DARK} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, 0.15]}>
        <boxGeometry args={[0.906, 0.022, 3.4]} />
        <meshStandardMaterial color={ACTIVE} roughness={0.7} />
      </mesh>
      {/* pare-brise cockpit */}
      <mesh position={[0, 0.13, 2.4]} rotation-x={-0.2}>
        <boxGeometry args={[0.34, 0.09, 0.26]} />
        <meshStandardMaterial color={DARK} roughness={0.6} />
      </mesh>

      {/* voilure (pièce : aile) */}
      <Wing side={1} geo={wing} winglet={winglet} color={wingColor} handlers={wingH} />
      <Wing side={-1} geo={wing} winglet={winglet} color={wingColor} handlers={wingH} />

      {/* empennage : stabilisateurs + dérive */}
      <group {...empH}>
        <mesh geometry={stab} rotation-x={Math.PI / 2} position={[0, 0.15, -3.15]}>
          <meshStandardMaterial color={empColor} roughness={0.85} side={THREE.DoubleSide} />
          <Edges color={EDGE} threshold={20} />
        </mesh>
        <mesh
          geometry={stab}
          rotation-x={Math.PI / 2}
          position={[0, 0.15, -3.15]}
          scale={[-1, 1, 1]}
        >
          <meshStandardMaterial color={empColor} roughness={0.85} side={THREE.DoubleSide} />
          <Edges color={EDGE} threshold={20} />
        </mesh>
        <mesh geometry={fin} rotation-y={Math.PI / 2} position={[-0.028, 0.25, -2.35]}>
          <meshStandardMaterial color={empColor} roughness={0.85} side={THREE.DoubleSide} />
          <Edges color={EDGE} threshold={20} />
        </mesh>
      </group>

      {/* carénage ventral / pack ECS */}
      <mesh position={[0, -0.38, 0.1]} scale={[1.1, 0.42, 2.5]} {...ecsH}>
        <sphereGeometry args={[0.5, 22, 14]} />
        <meshStandardMaterial color={ecsColor} roughness={0.9} />
      </mesh>

      {/* moteurs : droit = nacelle (acoustique), gauche = moteur/tuyère */}
      <Engine side={1} id="nacelle" p={p} pod={pod} />
      <Engine side={-1} id="moteur" p={p} pod={pod} />
    </group>
  );
}
