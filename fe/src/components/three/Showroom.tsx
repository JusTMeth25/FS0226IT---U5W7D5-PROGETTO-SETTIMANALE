import { Canvas, useFrame } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  PerformanceMonitor,
  Sparkles,
} from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Suspense, useRef, useState } from 'react'
import * as THREE from 'three'
import Auto3D from './Auto3D'

/**
 * Showroom 3D: pedana girevole con anello al neon, pavimento a specchio,
 * luci da studio fatte di Lightformer (nessun HDR da scaricare) e bloom sui fari.
 * Trascinando si gira intorno all'auto; lo zoom e' spento per non rubare lo scroll.
 */

function Pedana({ colore, gira }: { colore: string; gira: boolean }) {
  const gruppo = useRef<THREE.Group>(null)
  const anello = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((stato, dt) => {
    if (gruppo.current && gira) gruppo.current.rotation.y += dt * 0.25
    if (anello.current) {
      // L'anello "respira" piano.
      anello.current.emissiveIntensity = 2.2 + Math.sin(stato.clock.elapsedTime * 2) * 0.8
    }
  })

  return (
    <group ref={gruppo}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[3.3, 3.4, 0.06, 96]} />
        <meshStandardMaterial color="#0c0c12" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.15, 3.22, 128]} />
        <meshStandardMaterial ref={anello} color="#ff6a1a" emissive="#ff6a1a" toneMapped={false} />
      </mesh>
      <group position={[0, 0.05, 0]}>
        <Auto3D colore={colore} />
      </group>
    </group>
  )
}

/** La camera segue appena il mouse: profondita' anche senza trascinare. */
function Parallasse({ x }: { x: number }) {
  useFrame((stato) => {
    const { camera, pointer } = stato
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.9 + pointer.y * 0.4, 0.04)
    camera.lookAt(x, 0.7, 0)
  })
  return null
}

type Props = {
  colore: string
  gira?: boolean
  compatto?: boolean
  /** Sposta l'auto a destra per lasciare spazio al testo (hero su schermi larghi). */
  spostamento?: number
}

export default function Showroom({ colore, gira = true, compatto = false, spostamento = 0 }: Props) {
  const [qualita, setQualita] = useState(1.5)
  const ridotto =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <Canvas
      shadows
      dpr={[1, qualita]}
      camera={{ position: compatto ? [6.4, 2.2, 6.4] : [spostamento + 8.4, 2.1, 8.8], fov: compatto ? 32 : 30 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      aria-label="Auto in 3D: trascina per ruotare"
    >
      <PerformanceMonitor onDecline={() => setQualita(1)} onIncline={() => setQualita(1.5)} />
      <color attach="background" args={['#07070b']} />
      <fog attach="fog" args={['#07070b', 12, 26]} />

      <Suspense fallback={null}>
        <group position={[spostamento, 0, 0]}>
          <Float speed={ridotto ? 0 : 1.2} rotationIntensity={0} floatIntensity={0.15} floatingRange={[0, 0.08]}>
            <Pedana colore={colore} gira={gira && !ridotto} />
          </Float>
          <ContactShadows position={[0, 0.01, 0]} opacity={0.7} scale={12} blur={2.4} far={3} />
        </group>

        {/* pavimento a specchio */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[60, 60]} />
          <MeshReflectorMaterial
            blur={[300, 80]}
            resolution={1024}
            mixBlur={1}
            mixStrength={30}
            roughness={1}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#08080c"
            metalness={0.7}
            mirror={0.6}
          />
        </mesh>

        <Sparkles count={60} scale={[14, 4, 14]} position={[0, 2, 0]} size={2} speed={0.3} color="#ffb347" opacity={0.6} />

        {/* luci da studio: pannelli luminosi che si riflettono sulla vernice */}
        <Environment resolution={256} frames={1}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
            <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
            <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
            <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
            <Lightformer form="ring" color="#ff6a1a" intensity={6} onUpdate={(s) => s.lookAt(0, 0, 0)} position={[10, 10, 0]} scale={10} />
            <Lightformer form="rect" color="#22d3ee" intensity={3} position={[-10, 2, 4]} scale={[8, 2, 1]} />
          </group>
        </Environment>

        <ambientLight intensity={0.25} />
        <spotLight position={[spostamento, 9, 0]} angle={0.5} penumbra={1} intensity={80} castShadow shadow-mapSize={1024} />
        <directionalLight position={[spostamento + 6, 4, 6]} intensity={1.2} />
      </Suspense>

      <Parallasse x={spostamento} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.1}
        target={[spostamento, 0.7, 0]}
        makeDefault
      />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={1.1} radius={0.7} />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  )
}
