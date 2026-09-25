import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Tunnel di luci: centinaia di scie che corrono verso la camera, come le luci
 * di una galleria viste a 300 all'ora. Il mouse sposta lo sguardo, "turbo"
 * (hover sul pulsante principale) triplica la velocita'.
 */

const QUANTE = 420
const PROFONDITA = 120
const COLORI = ['#ff6a1a', '#ffb347', '#22d3ee', '#f4f4f8', '#ff2b2b']

type Scia = { angolo: number; raggio: number; z: number; lunghezza: number; velocita: number }

function Scie({ turbo }: { turbo: boolean }) {
  const rif = useRef<THREE.InstancedMesh>(null)
  const velocita = useRef(1)
  const matrice = useMemo(() => new THREE.Object3D(), [])

  const scie = useMemo<Scia[]>(
    () =>
      Array.from({ length: QUANTE }, () => ({
        angolo: Math.random() * Math.PI * 2,
        raggio: 2.2 + Math.random() * 7,
        z: -Math.random() * PROFONDITA,
        lunghezza: 1 + Math.random() * 5,
        velocita: 0.6 + Math.random() * 0.8,
      })),
    [],
  )

  // colori per istanza, assegnati una volta sola
  const colori = useMemo(() => {
    const c = new THREE.Color()
    const arr = new Float32Array(QUANTE * 3)
    for (let i = 0; i < QUANTE; i++) {
      c.set(COLORI[i % COLORI.length]).multiplyScalar(2.5 + Math.random() * 3)
      c.toArray(arr, i * 3)
    }
    return arr
  }, [])

  useFrame((stato, dt) => {
    const m = rif.current
    if (!m) return
    velocita.current = THREE.MathUtils.lerp(velocita.current, turbo ? 3.4 : 1, dt * 2.5)
    const passo = dt * 38 * velocita.current
    scie.forEach((s, i) => {
      s.z += passo * s.velocita
      if (s.z > 8) s.z -= PROFONDITA
      matrice.position.set(Math.cos(s.angolo) * s.raggio, Math.sin(s.angolo) * s.raggio * 0.6, s.z)
      matrice.scale.set(1, 1, s.lunghezza * (0.6 + velocita.current * 0.5))
      matrice.updateMatrix()
      m.setMatrixAt(i, matrice.matrix)
    })
    m.instanceMatrix.needsUpdate = true

    // lo sguardo segue il mouse, con morbidezza
    const { camera, pointer } = stato
    camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, -pointer.x * 0.18, 0.05)
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, pointer.y * 0.1, 0.05)
    camera.rotation.z += (Math.sin(stato.clock.elapsedTime * 0.3) * 0.02 - camera.rotation.z) * 0.02
  })

  return (
    <instancedMesh ref={rif} args={[undefined, undefined, QUANTE]}>
      <boxGeometry args={[0.035, 0.035, 1]}>
        <instancedBufferAttribute attach="attributes-color" args={[colori, 3]} />
      </boxGeometry>
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  )
}

/** Asfalto: griglia che scorre sotto, per dare il senso di strada. */
function Asfalto({ turbo }: { turbo: boolean }) {
  const griglia = useRef<THREE.GridHelper>(null)
  const v = useRef(1)
  useFrame((_, dt) => {
    v.current = THREE.MathUtils.lerp(v.current, turbo ? 3.4 : 1, dt * 2.5)
    if (griglia.current) griglia.current.position.z = (griglia.current.position.z + dt * 20 * v.current) % 4
  })
  return <gridHelper ref={griglia} args={[200, 100, '#ff6a1a', '#23232f']} position={[0, -3.2, 0]} />
}

export default function Tunnel({ turbo = false }: { turbo?: boolean }) {
  const ridotto =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 70 }} gl={{ antialias: false }} frameloop={ridotto ? 'demand' : 'always'}>
      <color attach="background" args={['#07070b']} />
      <fog attach="fog" args={['#07070b', 20, 110]} />
      <Scie turbo={turbo} />
      <Asfalto turbo={turbo} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={1.4} radius={0.75} />
        <Vignette eskil={false} offset={0.25} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
