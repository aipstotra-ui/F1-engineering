// Cleans an AI-generated .glb so it's ready for the app: centres it, scales it to real size,
// reduces triangles, shrinks textures and compresses it. Run scripts/check-glb.mjs on the input first.
// Usage: node scripts/clean-part.mjs <raw.glb> <out.glb> <longest-size-in-metres> [maxTriangles=50000] [textureSize=1024]
import { statSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { center, dedup, getBounds, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const [rawPath, outPath, sizeArg, maxTrisArg = '50000', texArg = '1024'] = process.argv.slice(2)
const sizeM = Number(sizeArg)
const maxTriangles = Number(maxTrisArg)
const textureSize = Number(texArg)
if (!rawPath || !outPath || !(sizeM > 0) || !(maxTriangles > 0) || !(textureSize > 0)) {
  console.log('Usage: node scripts/clean-part.mjs <raw.glb> <out.glb> <longest-size-in-metres> [maxTriangles] [textureSize]')
  process.exit(1)
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
const scale = sizeM / longest
for (const node of scene.listChildren()) {
  const [x, y, z] = node.getTranslation()
  const [sx, sy, sz] = node.getScale()
  node.setTranslation([x * scale, y * scale, z * scale])
  node.setScale([sx * scale, sy * scale, sz * scale])
}

// 4. Smaller textures, then compress the geometry.
await doc.transform(
  textureCompress({ encoder: sharp, resize: [textureSize, textureSize] }),
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
