import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'

/**
 * Coupe procedurale: nessun modello da scaricare. La carrozzeria e' il profilo
 * laterale estruso (con i passaruota ritagliati), l'abitacolo un secondo
 * profilo in vetro fume', le ruote cilindri con cerchi a razze.
 */

function profiloCarrozzeria() {
  const s = new THREE.Shape()
  s.moveTo(-2.2, 0.36)
  s.lineTo(-1.88, 0.3)
  s.absarc(-1.35, 0.3, 0.53, Math.PI, 0, true) // passaruota posteriore
  s.lineTo(0.82, 0.3)
  s.absarc(1.35, 0.3, 0.53, Math.PI, 0, true) // passaruota anteriore
  s.lineTo(2.18, 0.3)
  s.quadraticCurveTo(2.38, 0.36, 2.34, 0.58)
  s.quadraticCurveTo(2.3, 0.84, 1.9, 0.9)
  s.lineTo(1.2, 1.02)
  s.lineTo(-1.62, 1.04)
  s.quadraticCurveTo(-2.12, 1.04, -2.24, 0.86)
  s.quadraticCurveTo(-2.3, 0.6, -2.2, 0.36)
  return s
}

function profiloAbitacolo() {
  const s = new THREE.Shape()
  s.moveTo(1.18, 1.0)
  s.quadraticCurveTo(0.7, 1.28, 0.25, 1.5)
  s.quadraticCurveTo(-0.2, 1.56, -0.7, 1.5)
  s.quadraticCurveTo(-1.3, 1.34, -1.72, 1.0)
  s.closePath()
  return s
}

const liscio = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Un'estrusione e' una "fetta" con i fianchi dritti. Qui la si scolpisce:
 * muso e coda si stringono, la parte alta rientra verso l'interno.
 * Risultato: fianchi bombati invece di un mattone.
 */
function scolpisci(g: THREE.BufferGeometry, estremi: [number, number], alto: [number, number], quanto: [number, number]) {
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const stretto = 1 - quanto[0] * liscio(estremi[0], estremi[1], Math.abs(x))
    const rientro = 1 - quanto[1] * liscio(alto[0], alto[1], y)
    p.setZ(i, p.getZ(i) * stretto * rientro)
  }
  g.computeVertexNormals()
}

function Ruota({ x, z, rif }: { x: number; z: number; rif: RefObject<THREE.Group[]> }) {
  const razze = useMemo(() => Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2), [])
  const lato = z > 0 ? 1 : -1
  return (
    <group position={[x, 0.42, z]}>
      <group
        ref={(g) => {
          if (g && rif.current && !rif.current.includes(g)) rif.current.push(g)
        }}
      >
        {/* pneumatico */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.34, 40]} />
          <meshStandardMaterial color="#0b0b0e" roughness={0.9} />
        </mesh>
        {/* cerchio */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, lato * 0.172]}>
          <cylinderGeometry args={[0.3, 0.3, 0.02, 40]} />
          <meshStandardMaterial color="#c9ccd4" metalness={1} roughness={0.2} />
        </mesh>
        {razze.map((a) => (
          <mesh key={a} position={[0, 0, lato * 0.19]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.06, 0.52, 0.03]} />
            <meshStandardMaterial color="#e6e8ee" metalness={1} roughness={0.15} />
          </mesh>
        ))}
        {/* pinza freno arancio: si vede tra le razze */}
        <mesh position={[0.14, 0.08, lato * 0.15]}>
          <boxGeometry args={[0.1, 0.18, 0.04]} />
          <meshStandardMaterial color="#ff6a1a" emissive="#ff6a1a" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  )
}

type Props = {
  colore: string
  /** Velocita' di rotazione delle ruote (0 = ferme). */
  giri?: number
}

export default function Auto3D({ colore, giri = 0 }: Props) {
  const vernice = useRef<THREE.MeshPhysicalMaterial>(null)
  const ruote = useRef<THREE.Group[]>([])
  const obiettivo = useMemo(() => new THREE.Color(colore), [colore])

  const [carrozzeria, abitacolo] = useMemo(() => {
    const c = new THREE.ExtrudeGeometry(profiloCarrozzeria(), {
      depth: 1.7,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.1,
      bevelSegments: 8,
      curveSegments: 48,
    })
    c.translate(0, 0, -0.85)
    scolpisci(c, [1.4, 2.45], [0.7, 1.08], [0.24, 0.16])
    const a = new THREE.ExtrudeGeometry(profiloAbitacolo(), {
      depth: 1.34,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.08,
      bevelSegments: 8,
      curveSegments: 32,
    })
    a.translate(0, 0, -0.67)
    scolpisci(a, [0.4, 1.8], [1.05, 1.62], [0.28, 0.32])
    return [c, a]
  }, [])

  useFrame((_, dt) => {
    // La vernice sfuma verso il colore scelto invece di cambiare di colpo.
    vernice.current?.color.lerp(obiettivo, Math.min(1, dt * 4))
    if (giri) ruote.current.forEach((g) => (g.rotation.z -= dt * giri))
  })

  return (
    <group>
      <mesh geometry={carrozzeria} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={vernice}
          color={colore}
          metalness={0.55}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={1.6}
        />
      </mesh>

      <mesh geometry={abitacolo} castShadow>
        {/* vetro fume' con un filo di blu: riflette le luci dello studio */}
        <meshPhysicalMaterial color="#1b2536" metalness={0.35} roughness={0.04} clearcoat={1} envMapIntensity={3} />
      </mesh>

      {/* fari anteriori: emissivi oltre 1, il bloom li fa brillare */}
      {[-0.62, 0.62].map((z) => (
        <mesh key={z} position={[2.3, 0.72, z]} rotation={[0, 0, -0.35]}>
          <boxGeometry args={[0.08, 0.1, 0.46]} />
          <meshStandardMaterial color="#ffffff" emissive="#dff6ff" emissiveIntensity={6} toneMapped={false} />
        </mesh>
      ))}

      {/* barra posteriore a tutta larghezza */}
      <mesh position={[-2.33, 0.8, 0]}>
        <boxGeometry args={[0.05, 0.07, 1.7]} />
        <meshStandardMaterial color="#ff2b2b" emissive="#ff1a1a" emissiveIntensity={5} toneMapped={false} />
      </mesh>

      {/* profilo luminoso sotto la portiera */}
      {[-1.0, 1.0].map((z) => (
        <mesh key={z} position={[0, 0.34, z]}>
          <boxGeometry args={[1.5, 0.02, 0.02]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      ))}

      <Ruota x={1.35} z={0.86} rif={ruote} />
      <Ruota x={1.35} z={-0.86} rif={ruote} />
      <Ruota x={-1.35} z={0.86} rif={ruote} />
      <Ruota x={-1.35} z={-0.86} rif={ruote} />
    </group>
  )
}
