import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Sparkles } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { DISTANZA } from '@/lib/gara'

/**
 * Scena della drag race. Non contiene logica di gara: legge lo stato dal ref
 * "mondo" (aggiornato dalla pagina a passo fisso) e lo disegna.
 * Asse: le auto partono da z = 0 e corrono verso z = -402.
 */

export type AutoInPista = { x: number; v: number; nitro: boolean; colore: string; corsia: number }
export type Mondo = {
  auto: AutoInPista[] // la prima e' il giocatore
  vmax: number
  fase: 'scelta' | 'pronti' | 'gara' | 'fine'
}

const LARGHEZZA_CORSIA = 4
const xCorsia = (c: number) => (c - 1.5) * LARGHEZZA_CORSIA

/** Auto stilizzata: carrozzeria a spigoli morbidi, abitacolo in vetro, fari e fiamme del nitro. */
function Macchina({ indice, mondo }: { indice: number; mondo: RefObject<Mondo> }) {
  const gruppo = useRef<THREE.Group>(null)
  const ruote = useRef<THREE.Group[]>([])
  const fiamme = useRef<THREE.Group>(null)
  const dati = mondo.current.auto[indice]

  useFrame((stato) => {
    const a = mondo.current.auto[indice]
    if (!a || !gruppo.current) return
    gruppo.current.position.set(xCorsia(a.corsia), 0, -a.x)
    // leggero beccheggio in accelerazione
    gruppo.current.rotation.x = THREE.MathUtils.lerp(gruppo.current.rotation.x, a.v > 1 ? 0.02 : 0, 0.1)
    ruote.current.forEach((r) => (r.rotation.x -= a.v * 0.03))
    if (fiamme.current) {
      fiamme.current.visible = a.nitro
      const s = 0.8 + Math.sin(stato.clock.elapsedTime * 60) * 0.25
      fiamme.current.scale.set(1, 1, s)
    }
  })

  const ruota = (x: number, z: number) => (
    <group key={`${x}${z}`} position={[x, 0.38, z]}>
      <group ref={(g) => { if (g && !ruote.current.includes(g)) ruote.current.push(g) }}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.3, 24]} />
          <meshStandardMaterial color="#0b0b0e" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[x > 0 ? 0.16 : -0.16, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 6]} />
          <meshStandardMaterial color="#c9ccd4" metalness={1} roughness={0.25} />
        </mesh>
      </group>
    </group>
  )

  return (
    <group ref={gruppo}>
      <RoundedBox args={[1.9, 0.6, 4.3]} radius={0.22} smoothness={4} position={[0, 0.62, 0]} castShadow>
        <meshPhysicalMaterial color={dati.colore} metalness={0.6} roughness={0.25} clearcoat={1} clearcoatRoughness={0.05} />
      </RoundedBox>
      <RoundedBox args={[1.5, 0.5, 2]} radius={0.2} smoothness={4} position={[0, 1.1, 0.25]}>
        <meshPhysicalMaterial color="#141b28" metalness={0.4} roughness={0.05} clearcoat={1} />
      </RoundedBox>
      {/* alettone */}
      <mesh position={[0, 1.02, 1.95]}>
        <boxGeometry args={[1.7, 0.06, 0.35]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* fanali posteriori: il bloom li trasforma in scie rosse */}
      <mesh position={[0, 0.72, 2.16]}>
        <boxGeometry args={[1.6, 0.08, 0.04]} />
        <meshStandardMaterial color="#ff2b2b" emissive="#ff1a1a" emissiveIntensity={6} toneMapped={false} />
      </mesh>
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.66, -2.16]}>
          <boxGeometry args={[0.42, 0.1, 0.04]} />
          <meshStandardMaterial color="#fff" emissive="#dff6ff" emissiveIntensity={5} toneMapped={false} />
        </mesh>
      ))}
      {/* fiamme del nitro */}
      <group ref={fiamme} position={[0, 0.45, 2.3]} visible={false}>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.16, 1, 12]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={8} toneMapped={false} transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
      {ruota(-0.92, -1.4)}
      {ruota(0.92, -1.4)}
      {ruota(-0.92, 1.35)}
      {ruota(0.92, 1.35)}
    </group>
  )
}

/** Tante copie della stessa mesh in una sola draw call. */
function Istanze({ matrici, children }: { matrici: THREE.Matrix4[]; children: ReactNode }) {
  const rif = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = rif.current
    if (!m) return
    matrici.forEach((mat, i) => m.setMatrixAt(i, mat))
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }, [matrici])
  return (
    <instancedMesh ref={rif} args={[undefined, undefined, matrici.length]} frustumCulled={false}>
      {children}
    </instancedMesh>
  )
}

const matrice = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz))

/** Strada, strisce, bordi al neon, lampioni, traguardo e skyline. */
function Pista() {
  const strisce = useMemo(() => {
    const out: THREE.Matrix4[] = []
    for (let c = 1; c < 4; c++) for (let z = 20; z > -DISTANZA - 200; z -= 8) out.push(matrice((c - 2) * LARGHEZZA_CORSIA, 0.02, z))
    return out
  }, [])
  const lampioni = useMemo(() => {
    const pali: THREE.Matrix4[] = []
    const luci: THREE.Matrix4[] = []
    for (let z = 10; z > -DISTANZA - 200; z -= 24)
      for (const x of [-10.5, 10.5]) {
        pali.push(matrice(x, 3, z))
        luci.push(matrice(x > 0 ? x - 0.8 : x + 0.8, 6, z))
      }
    return { pali, luci }
  }, [])
  const palazzi = useMemo(() => {
    const scuri: THREE.Matrix4[] = []
    const caldi: THREE.Matrix4[] = []
    for (let i = 0; i < 90; i++) {
      const lato = i % 2 ? 1 : -1
      const h = 8 + Math.random() * 45
      const w = 6 + Math.random() * 10
      ;(i % 5 ? scuri : caldi).push(matrice(lato * (28 + Math.random() * 40), h / 2, 40 - Math.random() * 700, w, h, w))
    }
    return { scuri, caldi }
  }, [])
  const scacchi = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 32
    const g = c.getContext('2d')!
    for (let i = 0; i < 32; i++)
      for (let j = 0; j < 4; j++) {
        g.fillStyle = (i + j) % 2 ? '#ffffff' : '#07070b'
        g.fillRect(i * 8, j * 8, 8, 8)
      }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  return (
    <group>
      {/* asfalto */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -300]} receiveShadow>
        <planeGeometry args={[18, 900]} />
        <meshStandardMaterial color="#101016" roughness={0.85} metalness={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -300]}>
        <planeGeometry args={[400, 900]} />
        <meshStandardMaterial color="#060609" />
      </mesh>
      <Istanze matrici={strisce}>
        <boxGeometry args={[0.15, 0.01, 3]} />
        <meshStandardMaterial color="#9a9aa8" />
      </Istanze>
      {/* bordi al neon */}
      {[-8.2, 8.2].map((x, i) => (
        <mesh key={x} position={[x, 0.08, -300]}>
          <boxGeometry args={[0.12, 0.12, 900]} />
          <meshStandardMaterial color={i ? '#22d3ee' : '#ff6a1a'} emissive={i ? '#22d3ee' : '#ff6a1a'} emissiveIntensity={3} toneMapped={false} />
        </mesh>
      ))}
      {/* partenza e traguardo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -3]}>
        <planeGeometry args={[16, 0.6]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -DISTANZA]}>
        <planeGeometry args={[16, 2]} />
        <meshStandardMaterial map={scacchi} />
      </mesh>
      <group position={[0, 0, -DISTANZA]}>
        {[-8.6, 8.6].map((x) => (
          <mesh key={x} position={[x, 3.5, 0]}>
            <boxGeometry args={[0.5, 7, 0.5]} />
            <meshStandardMaterial color="#1a1a22" />
          </mesh>
        ))}
        <mesh position={[0, 7, 0]}>
          <boxGeometry args={[17.8, 1.4, 0.5]} />
          <meshStandardMaterial map={scacchi} emissive="#ffffff" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 6.2, 0.3]}>
          <boxGeometry args={[17.8, 0.1, 0.1]} />
          <meshStandardMaterial color="#ff6a1a" emissive="#ff6a1a" emissiveIntensity={6} toneMapped={false} />
        </mesh>
      </group>
      {/* lampioni */}
      <Istanze matrici={lampioni.pali}>
        <cylinderGeometry args={[0.08, 0.1, 6, 8]} />
        <meshStandardMaterial color="#1b1b24" />
      </Istanze>
      <Istanze matrici={lampioni.luci}>
        <boxGeometry args={[1.8, 0.12, 0.35]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffb347" emissiveIntensity={4} toneMapped={false} />
      </Istanze>
      {/* skyline */}
      <Istanze matrici={palazzi.scuri}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0c0c14" emissive="#1a1030" emissiveIntensity={0.6} />
      </Istanze>
      <Istanze matrici={palazzi.caldi}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0c0c14" emissive="#3a1606" emissiveIntensity={0.6} />
      </Istanze>
    </group>
  )
}

/**
 * Camera: durante il countdown gira lenta intorno all'auto del giocatore,
 * in gara la insegue; il campo visivo si allarga con la velocita' e col
 * nitro trema, come nei giochi di corse.
 */
function Regia({ mondo, aggiorna }: { mondo: RefObject<Mondo>; aggiorna: (dt: number) => void }) {
  const { camera } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const obiettivo = useMemo(() => new THREE.Vector3(), [])

  useFrame((stato, dt) => {
    aggiorna(Math.min(dt, 0.1))
    const m = mondo.current
    const g = m.auto[0]
    if (!g) return
    const xg = xCorsia(g.corsia)
    const rapporto = Math.min(1, g.v / Math.max(1, m.vmax))
    let desiderata: THREE.Vector3
    if (m.fase === 'pronti' || m.fase === 'scelta') {
      const a = stato.clock.elapsedTime * 0.35
      desiderata = new THREE.Vector3(xg + Math.sin(a) * 7, 2.4, -g.x + Math.cos(a) * 7)
      obiettivo.set(xg, 0.8, -g.x)
    } else {
      desiderata = new THREE.Vector3(xg * 0.6, 2.1 - rapporto * 0.5, -g.x + 7.5 - rapporto * 1.8)
      obiettivo.set(xg * 0.3, 1, -g.x - 20)
    }
    cam.position.lerp(desiderata, m.fase === 'gara' ? 0.2 : 0.05)
    if (m.fase === 'gara' && (g.nitro || rapporto > 0.7)) {
      const forza = (g.nitro ? 0.07 : 0.025) * rapporto
      cam.position.x += (Math.random() - 0.5) * forza
      cam.position.y += (Math.random() - 0.5) * forza
    }
    cam.lookAt(obiettivo)
    const fov = 58 + rapporto * 26 + (g.nitro ? 10 : 0)
    cam.fov = THREE.MathUtils.lerp(cam.fov, fov, 0.08)
    cam.updateProjectionMatrix()
  })
  return null
}

export default function Pista3D({ mondo, aggiorna }: { mondo: RefObject<Mondo>; aggiorna: (dt: number) => void }) {
  const offset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), [])
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 3, 8], fov: 60, far: 900 }} gl={{ antialias: true }}>
      <color attach="background" args={['#05050a']} />
      <fog attach="fog" args={['#05050a', 60, 380]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#6b5bff', '#ff6a1a', 0.35]} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} />
      <Pista />
      {mondo.current.auto.map((_, i) => (
        <Macchina key={i} indice={i} mondo={mondo} />
      ))}
      <Sparkles count={120} scale={[40, 10, 200]} position={[0, 5, -150]} size={3} speed={0.4} color="#ffb347" />
      <Regia mondo={mondo} aggiorna={aggiorna} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={1.3} radius={0.7} />
        <ChromaticAberration offset={offset} radialModulation={false} modulationOffset={0} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  )
}
