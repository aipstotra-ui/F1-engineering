// Safety check for downloaded/generated .glb files, shared by check-glb.mjs and clean-part.mjs.
// Reads the file as plain bytes + JSON (no 3D library involved) and reports anything unexpected.
import { readFileSync, statSync } from 'node:fs'

export const HARD_CAP_BYTES = 5 * 1024 * 1024 // docs/parts-pipeline.md: 5 MB hard cap
const TARGET_BYTES = 2 * 1024 * 1024 // 2 MB target (warning only)
// AI tools often embed their textures as base64 text inside the JSON, so the JSON can be most of the
// file. The file-size cap above already bounds it.
const MAX_JSON_BYTES = HARD_CAP_BYTES
const ALLOWED_EXTENSIONS = new Set([
  'KHR_materials_emissive_strength',
  'KHR_materials_ior',
  'KHR_materials_specular',
  'KHR_materials_clearcoat',
  'KHR_materials_transmission',
  'KHR_materials_unlit',
  'KHR_texture_transform',
  'KHR_mesh_quantization',
  'EXT_meshopt_compression',
  'EXT_texture_webp',
])
const DATA_URI = /^data:(application\/octet-stream|application\/gltf-buffer|image\/(png|jpeg|webp));base64,/
const SUSPICIOUS_TEXT = /<script|javascript:|<iframe|onerror=|eval\(/i

/** Checks one file; never throws. Returns { problems, warnings, stats }. */
export function checkGlb(path) {
  try {
    return checkGlbUnsafe(path)
  } catch (error) {
    return { problems: [`could not read safely: ${error.message}`], warnings: [], stats: null }
  }
}

function checkGlbUnsafe(path) {
  const problems = []
  const warnings = []
  const size = statSync(path).size
  if (size > HARD_CAP_BYTES) {
    return { problems: [`file is ${(size / 1e6).toFixed(1)} MB, above the 5 MB cap`], warnings, stats: null }
  }
  if (size > TARGET_BYTES) warnings.push(`file is ${(size / 1e6).toFixed(1)} MB, above the 2 MB target`)

  const bytes = readFileSync(path)
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF') {
    return { problems: ['not a binary glTF file (missing "glTF" header)'], warnings, stats: null }
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const version = view.getUint32(4, true)
  const declaredLength = view.getUint32(8, true)
  if (version !== 2) problems.push(`glTF version ${version}, expected 2`)
  if (declaredLength !== bytes.length) problems.push('header length does not match file size')

  const jsonLength = view.getUint32(12, true)
  const jsonType = bytes.toString('ascii', 16, 20)
  if (jsonType !== 'JSON' || jsonLength > MAX_JSON_BYTES || 20 + jsonLength > bytes.length) {
    return { problems: [...problems, 'first chunk is not a sane JSON chunk'], warnings, stats: null }
  }
  const jsonText = bytes.toString('utf8', 20, 20 + jsonLength)
  let gltf
  try {
    gltf = JSON.parse(jsonText)
  } catch {
    return { problems: [...problems, 'JSON chunk does not parse'], warnings, stats: null }
  }

  if (SUSPICIOUS_TEXT.test(jsonText)) problems.push('JSON contains script-like text')

  for (const [kind, list] of [
    ['buffer', gltf.buffers ?? []],
    ['image', gltf.images ?? []],
  ]) {
    if (!Array.isArray(list)) {
      problems.push(`${kind}s is not a list`)
      continue
    }
    list.forEach((item, i) => {
      if (item.uri !== undefined && !DATA_URI.test(item.uri)) {
        problems.push(`${kind} ${i} points to an outside file/URL (${String(item.uri).slice(0, 60)})`)
      }
    })
  }

  for (const ext of [...(gltf.extensionsUsed ?? []), ...(gltf.extensionsRequired ?? [])]) {
    if (!ALLOWED_EXTENSIONS.has(ext)) problems.push(`unexpected extension ${ext}`)
  }

  let triangles = 0
  for (const mesh of gltf.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      const accessor = gltf.accessors?.[prim.indices ?? prim.attributes?.POSITION]
      if (accessor && (prim.mode === undefined || prim.mode === 4)) triangles += Math.floor(accessor.count / 3)
    }
  }
  const stats = {
    sizeMB: +(size / 1e6).toFixed(2),
    meshes: gltf.meshes?.length ?? 0,
    triangles,
    textures: gltf.textures?.length ?? 0,
    generator: gltf.asset?.generator ?? 'unknown',
  }
  return { problems, warnings, stats }
}

