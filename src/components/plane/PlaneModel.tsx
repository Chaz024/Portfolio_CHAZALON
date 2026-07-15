import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';

/* Avion de ligne procédural, style maquette de bureau d'études :
   volumes unis blanc papier, arêtes soulignées à l'encre. Chaque
   pièce interactive porte un id (nacelle, aile, empennage, ecs, moteur). */

const BASE = '#EFEDE3';
const HOVER = '#FFD9C2';
const ACTIVE = '#FF4F00';
const EDGE = '#141414';

interface PartProps {
  active: string | null;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

function colorFor(id: string, active: string | null, hovered: string | null) {
  if (active === id) return ACTIVE;
  if (hovered === id) return HOVER;
  return BASE;
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

function useWingGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.3, 0.9);
    s.lineTo(3.2, -0.55);
    s.lineTo(3.2, -1.05);
    s.lineTo(0.3, -0.75);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: false });
  }, []);
}

function useStabGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.15, 0.4);
    s.lineTo(1.5, -0.2);
    s.lineTo(1.5, -0.5);
    s.lineTo(0.15, -0.35);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false });
  }, []);
}

function useFinGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(1.5, 0);
    s.lineTo(1.45, 1.25);
    s.lineTo(0.85, 1.25);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false });
  }, []);
}

function Engine({ side, id, p }: { side: 1 | -1; id: string; p: PartProps }) {
  const color = colorFor(id, p.active, p.hovered);
  const h = partHandlers(id, p);
  return (
    <group position={[1.35 * side, -0.38, 0.55]} {...h}>
      {/* pod */}
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.27, 0.27, 0.95, 20]} />
        <meshStandardMaterial color={color} roughness={0.85} />
        <Edges color={EDGE} threshold={20} />
      </mesh>
      {/* entrée d'air */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.46]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 20]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.7} />
      </mesh>
      {/* tuyère */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0, -0.62]}>
        <cylinderGeometry args={[0.19, 0.11, 0.32, 20]} />
        <meshStandardMaterial color={color} roughness={0.85} />
        <Edges color={EDGE} threshold={20} />
      </mesh>
      {/* mât */}
      <mesh position={[0, 0.24, -0.1]}>
        <boxGeometry args={[0.08, 0.28, 0.5]} />
        <meshStandardMaterial color={BASE} roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function PlaneModel(p: PartProps) {
  const wing = useWingGeometry();
  const stab = useStabGeometry();
  const fin = useFinGeometry();
  const fuselageMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: BASE, roughness: 0.9 }),
    [],
  );
  const wingColor = colorFor('aile', p.active, p.hovered);
  const empColor = colorFor('empennage', p.active, p.hovered);
  const ecsColor = colorFor('ecs', p.active, p.hovered);
  const wingH = partHandlers('aile', p);
  const empH = partHandlers('empennage', p);
  const ecsH = partHandlers('ecs', p);

  return (
    <group>
      {/* fuselage */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.3]} material={fuselageMat}>
        <cylinderGeometry args={[0.45, 0.45, 4.2, 28]} />
        <Edges color={EDGE} threshold={30} />
      </mesh>
      {/* nez */}
      <mesh position={[0, 0, 2.4]} scale={[1, 1, 1.8]} material={fuselageMat}>
        <sphereGeometry args={[0.45, 28, 18]} />
      </mesh>
      {/* cône de queue */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0.05, -2.9]} material={fuselageMat}>
        <cylinderGeometry args={[0.45, 0.07, 2.2, 28]} />
      </mesh>

      {/* voilure (pièce : aile) */}
      <mesh geometry={wing} rotation-x={Math.PI / 2} position={[0, -0.12, 0]} {...wingH}>
        <meshStandardMaterial color={wingColor} roughness={0.85} side={THREE.DoubleSide} />
        <Edges color={EDGE} threshold={20} />
      </mesh>
      <mesh
        geometry={wing}
        rotation-x={Math.PI / 2}
        position={[0, -0.12, 0]}
        scale={[-1, 1, 1]}
        {...wingH}
      >
        <meshStandardMaterial color={wingColor} roughness={0.85} side={THREE.DoubleSide} />
        <Edges color={EDGE} threshold={20} />
      </mesh>

      {/* empennage : stabilisateurs + dérive */}
      <group {...empH}>
        <mesh geometry={stab} rotation-x={Math.PI / 2} position={[0, 0.18, -3.2]}>
          <meshStandardMaterial color={empColor} roughness={0.85} side={THREE.DoubleSide} />
          <Edges color={EDGE} threshold={20} />
        </mesh>
        <mesh
          geometry={stab}
          rotation-x={Math.PI / 2}
          position={[0, 0.18, -3.2]}
          scale={[-1, 1, 1]}
        >
          <meshStandardMaterial color={empColor} roughness={0.85} side={THREE.DoubleSide} />
          <Edges color={EDGE} threshold={20} />
        </mesh>
        <mesh geometry={fin} rotation-y={Math.PI / 2} position={[-0.03, 0.3, -2.45]}>
          <meshStandardMaterial color={empColor} roughness={0.85} side={THREE.DoubleSide} />
          <Edges color={EDGE} threshold={20} />
        </mesh>
      </group>

      {/* carénage ventral / pack ECS */}
      <mesh position={[0, -0.4, 0.1]} scale={[1.15, 0.45, 2.6]} {...ecsH}>
        <sphereGeometry args={[0.5, 22, 14]} />
        <meshStandardMaterial color={ecsColor} roughness={0.9} />
      </mesh>

      {/* moteurs : droit = nacelle (acoustique), gauche = moteur/tuyère */}
      <Engine side={1} id="nacelle" p={p} />
      <Engine side={-1} id="moteur" p={p} />
    </group>
  );
}
