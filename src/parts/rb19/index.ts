// Which code builds which catalog part. Every part in src/data/parts.ts has an entry here.
import { BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { beamWing, frontWing, rearWing } from './aero.ts'
import { diffuser, engineCover, floor, halo, monocoque, nose, plank, seat, sidepods, steeringWheel } from './bodywork.ts'
import {
  brakeCalipers,
  brakeDiscs,
  brakeDucts,
  frontRockersDampers,
  frontSuspensionArms,
  frontUprights,
  rearRockersDampers,
  rearSuspensionArms,
  rearUprights,
  tyres,
  wheelRims,
} from './chassis.ts'
import {
  controlElectronics,
  energyStore,
  exhaust,
  gearbox,
  intercooler,
  mguH,
  mguK,
  oilCooler,
  radiators,
  rearCrashStructure,
  turbocharger,
  v6Engine,
} from './powertrain.ts'
import type { MaterialKind, Piece } from './types.ts'

export type { MaterialKind, Piece } from './types.ts'

export const PART_BUILDERS: Partial<Record<string, () => Piece[]>> = {
  monocoque,
  halo,
  seat,
  'steering-wheel': steeringWheel,
  'energy-store': energyStore,
  'control-electronics': controlElectronics,
  'v6-engine': v6Engine,
  turbocharger,
  'mgu-h': mguH,
  'mgu-k': mguK,
  exhaust,
  intercooler,
  gearbox,
  'rear-crash-structure': rearCrashStructure,
  radiators,
  'oil-cooler': oilCooler,
  'rear-suspension-arms': rearSuspensionArms,
  'rear-uprights': rearUprights,
  'rear-rockers-dampers': rearRockersDampers,
  'front-suspension-arms': frontSuspensionArms,
  'front-uprights': frontUprights,
  'front-rockers-dampers': frontRockersDampers,
  floor,
  plank,
  diffuser,
  sidepods,
  'engine-cover': engineCover,
  nose,
  'front-wing': frontWing,
  'beam-wing': beamWing,
  'rear-wing': rearWing,
  'brake-discs': brakeDiscs,
  'brake-calipers': brakeCalipers,
  'brake-ducts': brakeDucts,
  'wheel-rims': wheelRims,
  tyres,
}

/** Parts that turn see-through in X-ray mode so the internals show. */
export const OUTER_SHELL = new Set(['monocoque', 'nose', 'sidepods', 'engine-cover', 'wheel-rims', 'tyres'])

/**
 * Joins a part's pieces into one mesh per material, so the whole car draws in far fewer calls.
 * Pieces are converted to the same layout (non-indexed, position + normal + uv) before joining.
 */
export function mergeByMaterial(pieces: Piece[]): { material: MaterialKind; geometry: BufferGeometry }[] {
  const groups = new Map<MaterialKind, BufferGeometry[]>()
  for (const piece of pieces) {
    const g = piece.geometry.index ? piece.geometry.toNonIndexed() : piece.geometry.clone()
    for (const name of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name)
    }
    if (!g.getAttribute('normal')) g.computeVertexNormals()
    groups.set(piece.material, [...(groups.get(piece.material) ?? []), g])
  }
  return [...groups].map(([material, geometries]) => {
    const merged = mergeGeometries(geometries, false)
    if (!merged) throw new Error(`Could not merge pieces made of ${material}`)
    merged.computeBoundingSphere()
    for (const g of geometries) g.dispose()
    return { material, geometry: merged }
  })
}
