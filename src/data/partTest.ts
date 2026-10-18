// Step 3: AI part test. Candidates from different generators, compared side by side.
// Every model here passed scripts/check-glb.mjs and was cleaned with scripts/clean-part.mjs.

export interface TestPart {
  id: string
  name: string
  /** Reference picture the generators worked from (made with FLUX.1-schnell). Parts modelled in Blender have none. */
  reference?: string
}

export interface Candidate {
  partId: string
  tool: string
  licence: string
  model: string
  triangles: number
  sizeMB: number
}

export const TEST_PARTS: TestPart[] = [
  { id: 'turbocharger', name: 'Turbocharger', reference: '/models/parts-test/ref/turbocharger.webp' },
  { id: 'brake-caliper', name: 'Brake caliper', reference: '/models/parts-test/ref/brake-caliper.webp' },
  { id: 'sidepods', name: 'Sidepod' }, // AI pictures failed; modelled in Blender instead
]

// Filled in as parts are generated; see the sources table in docs/parts-pipeline.md.
export const CANDIDATES: Candidate[] = [
  {
    partId: 'turbocharger',
    tool: 'Hunyuan3D 2.1 (raw)',
    licence: 'Tencent Hunyuan Community',
    model: '/models/parts-test/hunyuan3d-2.1/turbocharger.glb',
    triangles: 40000,
    sizeMB: 0.93,
  },
  {
    partId: 'turbocharger',
    tool: 'Hunyuan3D 2.1 + Blender finish',
    licence: 'Tencent Hunyuan Community',
    model: '/models/parts-test/hunyuan3d-2.1-blender/turbocharger.glb',
    triangles: 40000,
    sizeMB: 1.89,
  },
]

export function candidatesFor(partId: string): Candidate[] {
  return CANDIDATES.filter((candidate) => candidate.partId === partId)
}
