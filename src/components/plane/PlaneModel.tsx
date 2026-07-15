import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

/* Airbus A380 réel : GLB issu d'un kit d'impression 3D (STL par pièce),
   optimisé (meshopt) et ré-assemblé ici. Chaque pièce imprimable était
   posée à plat : la table T ci-dessous donne la transformation
   d'assemblage (mm, repère avion : nez vers +z, y vers le haut).
   Matériaux : peinture blanche vernie + nacelles métal, reflets studio. */

const WHITE = '#FAFAFA'; // Peinture laquée pure
const GREY = '#E5E7EB'; // Peinture claire
const METAL = '#9CA3AF'; // Métal réaliste
const HOVER = '#FFB68C';
const ACTIVE = '#FF4F00';

/** échelle mm → unités scène (l'avion fait ~350 mm → ~6,7 unités) */
export const A380_SCALE = 0.019;

interface Placement {
  pos: [number, number, number];
  rotDeg?: [number, number, number];
  /** images des axes locaux [X', Y', Z'] (det +1) */
  basis?: [number[], number[], number[]];
  /** rotation résiduelle autour du z local (pièce imprimée en diagonale) */
  twist?: number;
}

const T: Record<string, Placement> = {
  fuselage_fwd: { pos: [0, 0, 0] },
  fuselage_aft: { pos: [0, 0, 0], rotDeg: [0, 180, 0] },
  // les deux ailes sont permutées : seule l'épaisseur (x local) est miroir
  wing_left: { pos: [0, -10, 15], basis: [[0, -1, 0], [0, 0, -1], [1, 0, 0]], twist: 40 },
  wing_right: { pos: [0, -10, 15], basis: [[0, 1, 0], [0, 0, -1], [-1, 0, 0]], twist: -40 },
  hstab_left: { pos: [0, 8, -145], basis: [[0, -1, 0], [0, 0, -1], [1, 0, 0]], twist: 45 },
  hstab_right: { pos: [0, 8, -145], basis: [[0, 1, 0], [0, 0, -1], [-1, 0, 0]], twist: -45 },
  vert_stab: { pos: [0, 18, -130], basis: [[1, 0, 0], [0, 0, -1], [0, 1, 0]], twist: 45 },
  engine_2: { pos: [64, -16, 60], rotDeg: [0, 180, 0] },
  engine_3: { pos: [-64, -16, 60], rotDeg: [0, 180, 0] },
  engine_1: { pos: [110, -9, 22], rotDeg: [0, 180, 0] },
  engine_4: { pos: [-110, -9, 22], rotDeg: [0, 180, 0] },
  winglet_right: { pos: [201, 2, -37], basis: [[0, 1, 0], [0, 0, 1], [1, 0, 0]] },
  winglet_left: { pos: [-201, 2, -37], basis: [[0, -1, 0], [0, 0, 1], [-1, 0, 0]] },
};

/** pièce interactive portée par chaque node du GLB (null = fuselage, non interactif) */
const PART_OF: Record<string, string | null> = {
  fuselage_fwd: null,
  fuselage_aft: null,
  wing_left: 'aile',
  wing_right: 'aile',
  winglet_left: 'aile',
  winglet_right: 'aile',
  engine_1: 'nacelle',
  engine_2: 'nacelle',
  engine_3: 'moteur',
  engine_4: 'moteur',
  vert_stab: 'empennage',
  hstab_left: 'empennage',
  hstab_right: 'empennage',
};

const METAL_PARTS = new Set(['engine_1', 'engine_2', 'engine_3', 'engine_4']);

function placementMatrix(t: Placement): THREE.Matrix4 {
  const M = new THREE.Matrix4();
  if (t.basis) {
    const [X, Y, Z] = t.basis.map((v) => new THREE.Vector3(...(v as [number, number, number])));
    M.makeBasis(X, Y, Z);
    if (t.twist) M.multiply(new THREE.Matrix4().makeRotationZ((t.twist * Math.PI) / 180));
  } else if (t.rotDeg) {
    const [x, y, z] = t.rotDeg.map((d) => (d * Math.PI) / 180);
    M.makeRotationFromEuler(new THREE.Euler(x, y, z));
  }
  M.setPosition(new THREE.Vector3(...t.pos));
  return M;
}

interface PartProps {
  active: string | null;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  modelUrl: string;
}

function partHandlers(id: string | null, p: PartProps) {
  if (!id) return {};
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

export default function PlaneModel(p: PartProps) {
  const gltf = useGLTF(p.modelUrl);

  // extrait, pour chaque node nommé, ses meshes avec leur transform local
  // (la quantization du GLB stocke un offset/scale sur le node : on le garde)
  const parts = useMemo(() => {
    const out: { name: string; items: { geo: THREE.BufferGeometry; matrix: THREE.Matrix4 }[] }[] = [];
    for (const node of gltf.scene.children) {
      if (!(node.name in T)) continue;
      node.updateWorldMatrix(true, true);
      const inv = node.parent!.matrixWorld.clone().invert();
      const items: { geo: THREE.BufferGeometry; matrix: THREE.Matrix4 }[] = [];
      node.traverse((c) => {
        const mesh = c as THREE.Mesh;
        if (mesh.isMesh) {
          items.push({
            geo: mesh.geometry,
            matrix: inv.clone().multiply(mesh.matrixWorld),
          });
        }
      });
      out.push({ name: node.name, items });
    }
    return out;
  }, [gltf]);

  const colorFor = (name: string) => {
    const id = PART_OF[name];
    const base = METAL_PARTS.has(name) ? METAL : name.startsWith('fuselage') ? WHITE : GREY;
    if (id && p.active === id) return ACTIVE;
    if (id && p.hovered === id) return HOVER;
    return base;
  };

  return (
    <group scale={A380_SCALE} position={[0, 0.15, 0.05]}>
      {parts.map(({ name, items }) => (
        <group key={name} matrix={placementMatrix(T[name])} matrixAutoUpdate={false} {...partHandlers(PART_OF[name], p)}>
          {items.map((it, i) => (
            <mesh key={i} geometry={it.geo} matrix={it.matrix} matrixAutoUpdate={false}>
              {METAL_PARTS.has(name) ? (
                <meshPhysicalMaterial
                  color={colorFor(name)}
                  roughness={0.4}
                  metalness={0.9}
                  envMapIntensity={1.5}
                  emissive={colorFor(name) === ACTIVE || colorFor(name) === HOVER ? colorFor(name) : '#000000'}
                  emissiveIntensity={colorFor(name) === ACTIVE ? 0.3 : colorFor(name) === HOVER ? 0.15 : 0}
                />
              ) : (
                <meshPhysicalMaterial
                  color={colorFor(name)}
                  roughness={0.15}
                  metalness={0.1}
                  clearcoat={1}
                  clearcoatRoughness={0.05}
                  envMapIntensity={1.4}
                  emissive={colorFor(name) === ACTIVE || colorFor(name) === HOVER ? colorFor(name) : '#000000'}
                  emissiveIntensity={colorFor(name) === ACTIVE ? 0.3 : colorFor(name) === HOVER ? 0.15 : 0}
                />
              )}
            </mesh>
          ))}
        </group>
      ))}
      {/* zone pack ECS (carénage ventral, fondu dans le fuselage) :
          fantôme cliquable qui s'encre au survol/à la sélection */}
      <mesh
        position={[0, -14, 5]}
        scale={[30, 16, 95]}
        {...partHandlers('ecs', p)}
      >
        <sphereGeometry args={[1, 28, 18]} />
        <meshPhysicalMaterial
          color={ACTIVE}
          transparent
          opacity={p.active === 'ecs' ? 0.4 : p.hovered === 'ecs' ? 0.25 : 0}
          roughness={0.5}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
