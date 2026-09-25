import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { Modello } from '@/lib/modelli'

/**
 * Carica un modello Sketchfab e lo porta nello "spazio auto" del gioco:
 * muso verso -z, ruote a terra (y = 0), centrato, lungo quanto un'auto vera.
 * useDraco = false: i nostri file usano meshopt, niente decoder da CDN esterne.
 */
export default function ModelloReale({ modello, lunghezza }: { modello: Modello; lunghezza: number }) {
  const gltf = useGLTF(`/modelli/${modello.file}`, false, true)

  const oggetto = useMemo(() => {
    const scena = gltf.scene.clone(true)
    const esterno = new THREE.Group()
    esterno.add(scena)

    const ingombro = () => {
      esterno.updateMatrixWorld(true)
      const b = new THREE.Box3()
      scena.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh || !m.visible || modello.ignoraIngombro.includes(m.name)) return
        m.geometry.computeBoundingBox()
        b.union(m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld))
      })
      return b
    }

    // lato lungo lungo l'asse z, poi la correzione del singolo modello
    let s = ingombro().getSize(new THREE.Vector3())
    if (s.x > s.z) scena.rotation.y = Math.PI / 2
    scena.rotation.y += THREE.MathUtils.degToRad(modello.rotazione)
    s = ingombro().getSize(new THREE.Vector3())
    scena.scale.multiplyScalar(lunghezza / Math.max(s.z, 0.001))

    const b = ingombro()
    const c = b.getCenter(new THREE.Vector3())
    scena.position.set(-c.x, -b.min.y, -c.z)

    scena.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return esterno
  }, [gltf, modello, lunghezza])

  return <primitive object={oggetto} />
}
