// Cleans an AI-generated .glb so it's ready for the app: centres it, scales it to real size,
// reduces triangles, adds missing normals, shrinks textures and compresses it.
// It runs the same safety check as scripts/check-glb.mjs first and refuses unsafe files.
// Usage: node scripts/clean-part.mjs <raw.glb> <out.glb> <longest-size-in-metres> [maxTriangles=50000] [textureSize=1024]
import { statSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { center, dedup, getBounds, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import { checkGlb } from './glb-safety.mjs'

const [rawPath, outPath, sizeArg, maxTrisArg = '50000', texArg = '1024'] = process.argv.slice(2)
const sizeM = Number(sizeArg)
const maxTriangles = Number(maxTrisArg)
const textureSize = Number(texArg)
if (!rawPath || !outPath || !(sizeM > 0) || !(maxTriangles > 0) || !(textureSize > 0)) {
  console.log('Usage: node scripts/clean-part.mjs <raw.glb> <out.glb> <longest-size-in-metres> [maxTriangles] [textureSize]')
  process.exit(1)
}

/**
 * Gives smooth normals to primitives that have none (without them a part renders black).
 * Each corner gets the area-weighted average of the faces around it; the mesh stays welded.
 */
function addMissingNormals(doc) {
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      if (prim.getAttribute('NORMAL')) continue
      const position = prim.getAttribute('POSITION')
      const indices = prim.getIndices()
      const sums = new Float32Array(position.getCount() * 3)
      const count = indices ? indices.getCount() : position.getCount()
      const [a, b, c] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
      for (let i = 0; i + 2 < count; i += 3) {
        const ids = [0, 1, 2].map((k) => (indices ? indices.getScalar(i + k) : i + k))
        position.getElement(ids[0], a)
        position.getElement(ids[1], b)
        position.getElement(ids[2], c)
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
        const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
        const face = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]] // length = 2 × area
        for (const id of ids) for (let k = 0; k < 3; k++) sums[id * 3 + k] += face[k]
      }
      for (let i = 0; i < sums.length; i += 3) {
        const length = Math.hypot(sums[i], sums[i + 1], sums[i + 2]) || 1
        sums[i] /= length
        sums[i + 1] /= length
        sums[i + 2] /= length
      }
      prim.setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(sums).setBuffer(position.getBuffer()))
    }
  }
}

function countTriangles(doc) {
  let total = 0
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices()
      total += Math.floor((indices ?? prim.getAttribute('POSITION')).getCount() / 3)
    }
  }
  return total
}

// Never let a 3D library open a file that hasn't passed the safety check (it could, e.g., link to other files).
const safety = checkGlb(rawPath)
if (safety.problems.length > 0) {
  console.log(`Refusing to clean ${rawPath}: ${safety.problems.join('; ')}`)
  process.exit(1)
}

await MeshoptDecoder.ready
await MeshoptEncoder.ready
await MeshoptSimplifier.ready
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })

const doc = await io.read(rawPath)
const trianglesBefore = countTriangles(doc)

// 0. Some generators label JPEG textures as PNG; read the real type from the first bytes.
function sniffImageType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp'
  return null
}
for (const texture of doc.getRoot().listTextures()) {
  const image = texture.getImage()
  const actual = image && sniffImageType(image)
  if (actual && actual !== texture.getMimeType()) texture.setMimeType(actual)
}

// 1. Tidy up: merge duplicate data, drop unused data, join shared vertices.
await doc.transform(dedup(), prune(), weld())

// 2. Fewer triangles, if there are more than we need.
if (trianglesBefore > maxTriangles) {
  await doc.transform(
    simplify({ simplifier: MeshoptSimplifier, ratio: maxTriangles / trianglesBefore, error: 0.01 }),
    prune(),
  )
}

// 3. Centre on the origin, then scale so the longest side matches the real part.
await doc.transform(center({ pivot: 'center' }))
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]
const { min, max } = getBounds(scene)
const longest = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2])
if (!(longest > 0 && Number.isFinite(longest))) {
  console.log(`Refusing to clean ${rawPath}: it has no visible geometry`)
  process.exit(1)
}
const scale = sizeM / longest
// The part is centred on the origin, so scaling every top-level node's position and size by the same
// factor scales the whole part about its centre.
for (const node of scene.listChildren()) {
  const [x, y, z] = node.getTranslation()
  const [sx, sy, sz] = node.getScale()
  node.setTranslation([x * scale, y * scale, z * scale])
  node.setScale([sx * scale, sy * scale, sz * scale])
}

// 4. Add normals where the generator left them out, shrink the textures (colour as JPEG, the rest as
//    WebP: a fraction of the size of PNG), then compress the geometry.
addMissingNormals(doc)
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: 'jpeg', quality: 85, resize: [textureSize, textureSize], slots: /^baseColor/ }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 90, resize: [textureSize, textureSize], slots: /^(?!baseColor)/ }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
)

await io.write(outPath, doc)
const trianglesAfter = countTriangles(doc)
console.log(
  JSON.stringify({
    out: outPath,
    triangles: `${trianglesBefore} -> ${trianglesAfter}`,
    sizeMB: `${(statSync(rawPath).size / 1e6).toFixed(2)} -> ${(statSync(outPath).size / 1e6).toFixed(2)}`,
    longestSideM: sizeM,
  }),
)
