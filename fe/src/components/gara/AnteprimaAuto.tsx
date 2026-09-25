import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import type { Modello } from '@/lib/modelli'
import ModelloReale from './ModelloReale'

/** Il modello reale su un piatto girevole: si trascina per guardarlo da ogni lato. */
export default function AnteprimaAuto({ modello, lunghezza }: { modello: Modello; lunghezza: number }) {
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [5.5, 2.2, 5.5], fov: 35 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={2} castShadow />
      {/* luci da studio fatte di pannelli: niente HDR da scaricare */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, -6]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" color="#ff6a1a" intensity={3} position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[8, 1, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <ModelloReale modello={modello} lunghezza={lunghezza} />
      </Suspense>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.7} scale={10} blur={2.2} far={3} />
      <OrbitControls autoRotate autoRotateSpeed={1.4} enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.1} target={[0, 0.6, 0]} />
    </Canvas>
  )
}
