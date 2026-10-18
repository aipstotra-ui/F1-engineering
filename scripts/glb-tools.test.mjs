import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Document, NodeIO } from '@gltf-transform/core'

let dir

// A 2 × 1 × 0.5 box (12 triangles), saved as a real .glb.
async function writeBoxGlb(path) {
  const doc = new Document()
  const buffer = doc.createBuffer()
  const [x, y, z] = [1, 0.5, 0.25]
  const corners = [
    [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
    [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
  ]
  const faces = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 2, 3, 7, 2, 7, 6, 1, 2, 6, 1, 6, 5, 0, 4, 7, 0, 7, 3]
  const position = doc.createAccessor().setType('VEC3').setArray(new Float32Array(corners.flat())).setBuffer(buffer)
  const indices = doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(faces)).setBuffer(buffer)
  const prim = doc.createPrimitive().setAttribute('POSITION', position).setIndices(indices)
  const node = doc.createNode('box').setMesh(doc.createMesh().addPrimitive(prim)).setTranslation([5, 5, 5])
  doc.createScene().addChild(node)
  await new NodeIO().write(path, doc)
}

// Builds a minimal .glb by hand so its JSON can contain anything we want to test.
function writeRawGlb(path, json) {
  let text = JSON.stringify(json)
  while (text.length % 4 !== 0) text += ' '
  const body = Buffer.from(text, 'utf8')
  const header = Buffer.alloc(20)
  header.write('glTF', 0, 'ascii')
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(20 + body.length, 8)
  header.writeUInt32LE(body.length, 12)
  header.write('JSON', 16, 'ascii')
  writeFileSync(path, Buffer.concat([header, body]))
}

function runCheck(file) {
  try {
    return { code: 0, out: execFileSync('node', ['scripts/check-glb.mjs', file], { encoding: 'utf8' }) }
  } catch (error) {
    return { code: error.status, out: String(error.stdout) }
  }
}

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'glb-tools-'))
  await writeBoxGlb(join(dir, 'box.glb'))
  writeRawGlb(join(dir, 'external.glb'), {
    asset: { version: '2.0' },
    buffers: [{ byteLength: 4, uri: 'https://example.com/steal.bin' }],
  })
  writeRawGlb(join(dir, 'script.glb'), { asset: { version: '2.0', generator: '<script>alert(1)</script>' } })
  writeRawGlb(join(dir, 'odd-extension.glb'), { asset: { version: '2.0' }, extensionsUsed: ['VENDOR_unknown'] })
  writeFileSync(join(dir, 'fake.glb'), 'this is not a 3D file')
  writeRawGlb(join(dir, 'html-uri.glb'), { asset: { version: '2.0' }, images: [{ uri: 'data:text/html;base64,PHNjcmlwdD4=' }] })
  writeRawGlb(join(dir, 'file-uri.glb'), { asset: { version: '2.0' }, buffers: [{ byteLength: 4, uri: 'file:///etc/passwd' }] })
  writeFileSync(join(dir, 'huge.glb'), Buffer.alloc(5 * 1024 * 1024 + 1))
  // Like Hunyuan3D's output: a 3 MB texture embedded as a data URI inside the JSON chunk.
  writeRawGlb(join(dir, 'embedded-texture.glb'), {
    asset: { version: '2.0' },
    images: [{ uri: `data:image/png;base64,${'A'.repeat(3 * 1024 * 1024)}` }],
  })
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('check-glb', () => {
  it('passes a normal embedded .glb', () => {
    const { code, out } = runCheck(join(dir, 'box.glb'))
    expect(code).toBe(0)
    expect(out).toContain('"triangles":12')
  })

  it('passes a .glb whose textures are embedded as data URIs in the JSON', () => {
    expect(runCheck(join(dir, 'embedded-texture.glb')).code).toBe(0)
  })

  it.each([
    ['external.glb', 'outside file/URL'],
    ['script.glb', 'script-like text'],
    ['odd-extension.glb', 'unexpected extension'],
    ['fake.glb', 'not a binary glTF'],
    ['html-uri.glb', 'outside file/URL'],
    ['file-uri.glb', 'outside file/URL'],
    ['huge.glb', 'above the 5 MB cap'],
  ])('rejects %s', (file, reason) => {
    const { code, out } = runCheck(join(dir, file))
    expect(code).toBe(1)
    expect(out).toContain(reason)
  })
})

describe('clean-part', () => {
  it('cleans a part whose JPEG texture is mislabelled as PNG', async () => {
    const { default: sharp } = await import('sharp')
    const jpeg = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#888' } }).jpeg().toBuffer()
    const doc = new Document()
    const buffer = doc.createBuffer()
    const position = doc.createAccessor().setType('VEC3').setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])).setBuffer(buffer)
    const uv = doc.createAccessor().setType('VEC2').setArray(new Float32Array([0, 0, 1, 0, 0, 1])).setBuffer(buffer)
    const texture = doc.createTexture().setImage(new Uint8Array(jpeg)).setMimeType('image/png')
    const material = doc.createMaterial().setBaseColorTexture(texture)
    const prim = doc.createPrimitive().setAttribute('POSITION', position).setAttribute('TEXCOORD_0', uv).setMaterial(material)
    doc.createScene().addChild(doc.createNode().setMesh(doc.createMesh().addPrimitive(prim)))
    const raw = join(dir, 'mislabelled.glb')
    await new NodeIO().write(raw, doc)
    const out = join(dir, 'mislabelled-clean.glb')
    execFileSync('node', ['scripts/clean-part.mjs', raw, out, '0.5'], { encoding: 'utf8' })
    expect(runCheck(out).code).toBe(0)
    // The generator left out normals; clean-part adds them so the part isn't drawn black.
    const { MeshoptDecoder } = await import('meshoptimizer')
    const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions')
    await MeshoptDecoder.ready
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder })
    const cleaned = await io.read(out)
    expect(cleaned.getRoot().listMeshes()[0].listPrimitives()[0].getAttribute('NORMAL')).not.toBeNull()
  })

  it('refuses to clean an unsafe file', () => {
    expect(() => execFileSync('node', ['scripts/clean-part.mjs', join(dir, 'external.glb'), join(dir, 'x.glb'), '0.5'], { encoding: 'utf8' })).toThrow()
  })

  it('centres the part, scales its longest side and keeps it safe', async () => {
    const out = join(dir, 'box-clean.glb')
    execFileSync('node', ['scripts/clean-part.mjs', join(dir, 'box.glb'), out, '0.5'], { encoding: 'utf8' })
    expect(runCheck(out).code).toBe(0)

    const { getBounds } = await import('@gltf-transform/functions')
    const { MeshoptDecoder } = await import('meshoptimizer')
    const { ALL_EXTENSIONS } = await import('@gltf-transform/extensions')
    await MeshoptDecoder.ready
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder })
    const doc = await io.read(out)
    const { min, max } = getBounds(doc.getRoot().listScenes()[0])
    const sizes = [0, 1, 2].map((axis) => max[axis] - min[axis])
    expect(Math.max(...sizes)).toBeCloseTo(0.5, 3)
    for (const axis of [0, 1, 2]) expect((max[axis] + min[axis]) / 2).toBeCloseTo(0, 3)
  })
})
