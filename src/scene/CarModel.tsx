import { memo, useEffect, useMemo } from 'react'
import { Mesh, type BufferGeometry, type Raycaster } from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { PARTS } from '../data/parts.ts'
import { OUTER_SHELL, PART_BUILDERS, mergeByMaterial, type MaterialKind } from '../parts/rb19/index.ts'
import { useCarStore } from '../state/carStore.ts'
import { getMaterial } from './materials.ts'

interface PartMeshes {
  id: string
  meshes: { material: MaterialKind; geometry: BufferGeometry }[]
}

const DEFAULT_RAYCAST = Mesh.prototype.raycast
// See-through (X-ray) parts ignore the mouse so you can click the internals behind them.
const NO_RAYCAST = (_raycaster: Raycaster, _hits: unknown[]) => {}

const CarPart = memo(function CarPart({ id, meshes }: PartMeshes) {
  const mode = useCarStore((s) => s.viewMode)
  const ghost = useCarStore((s) => s.xray && OUTER_SHELL.has(id))
  const picked = useCarStore((s) => s.selectedPartId === id || s.hoveredPartId === id)
  const hoverPart = useCarStore((s) => s.hoverPart)
  const selectPart = useCarStore((s) => s.selectPart)
  // A picked part always lights up, even when X-ray would make it see-through.
  const variant = picked ? 'highlight' : ghost ? 'ghost' : 'normal'
  const clickable = !ghost || picked

  return (
    <group
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        hoverPart(id)
      }}
      onPointerOut={() => hoverPart(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        selectPart(id)
      }}
    >
      {meshes.map((m) => (
        <mesh
          key={m.material}
          geometry={m.geometry}
          material={getMaterial(m.material, mode, variant)}
          raycast={clickable ? DEFAULT_RAYCAST : NO_RAYCAST}
        />
      ))}
    </group>
  )
})

/** The whole code-built RB19: every catalog part, one mesh per material. */
export function CarModel() {
  // Building the shapes takes a moment, so it happens once per mount, not on every render.
  const parts = useMemo<PartMeshes[]>(
    () =>
      PARTS.flatMap((part) => {
        const build = PART_BUILDERS[part.id]
        return build ? [{ id: part.id, meshes: mergeByMaterial(build()) }] : []
      }),
    [],
  )

  useEffect(
    () => () => {
      for (const part of parts) for (const m of part.meshes) m.geometry.dispose()
    },
    [parts],
  )

  return (
    <group>
      {parts.map((part) => (
        <CarPart key={part.id} id={part.id} meshes={part.meshes} />
      ))}
    </group>
  )
}
