// Surface textures drawn by code (nothing is downloaded or stored). Every texture is made once and shared.
// The car's texture coordinates are in metres (see geometry.ts), so `repeat` = how many tiles per metre.
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

const canBuild = () => typeof document !== 'undefined'

function canvas2d(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  return ctx ? [canvas, ctx] : null
}

function tiled(canvas: HTMLCanvasElement, tilesPerMetre: number, colour: boolean): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(tilesPerMetre, tilesPerMetre)
  texture.anisotropy = 8 // keeps the pattern crisp on surfaces seen at a glancing angle
  if (colour) texture.colorSpace = SRGBColorSpace
  return texture
}

/** Small deterministic random generator, so every load draws exactly the same textures. */
function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

// ---------- carbon fibre ----------

/** One weave tile is 8 × 8 tows; real tows are about 6 mm wide, so a tile is about 48 mm. */
const WEAVE_TILE_METRES = 0.048
const WEAVE_CELLS = 8

/** Height of the weave at a pixel: each tow bulges in the middle (2×2 twill pattern). */
function weaveHeight(px: number, py: number, size: number): number {
  const cell = size / WEAVE_CELLS
  const x = ((px % size) + size) % size
  const y = ((py % size) + size) % size
  const warp = (Math.floor(x / cell) + Math.floor(y / cell)) % 4 < 2
  const across = warp ? (y % cell) / cell : (x % cell) / cell
  const along = warp ? (x % cell) / cell : (y % cell) / cell
  return Math.sin(across * Math.PI) * (0.85 + 0.15 * Math.sin(along * Math.PI))
}

let carbonColourCache: CanvasTexture | null | undefined
let carbonNormalCache: CanvasTexture | null | undefined

/** Colour of the weave: dark tows with a lighter sheen along each one. */
export function carbonColour(): CanvasTexture | null {
  if (carbonColourCache !== undefined) return carbonColourCache
  carbonColourCache = null
  const made = canBuild() && canvas2d(512)
  if (!made) return null
  const [canvas, ctx] = made
  const image = ctx.createImageData(512, 512)
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const h = weaveHeight(x, y, 512)
      const v = 14 + h * 34 // between very dark and dark grey
      const i = (y * 512 + x) * 4
      image.data[i] = v
      image.data[i + 1] = v + 1
      image.data[i + 2] = v + 4
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  carbonColourCache = tiled(canvas, 1 / WEAVE_TILE_METRES, true)
  return carbonColourCache
}

/** Bump map of the weave: reflections ripple across the tows like real carbon. */
export function carbonNormal(): CanvasTexture | null {
  if (carbonNormalCache !== undefined) return carbonNormalCache
  carbonNormalCache = null
  const made = canBuild() && canvas2d(512)
  if (!made) return null
  const [canvas, ctx] = made
  const image = ctx.createImageData(512, 512)
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const dx = weaveHeight(x + 1, y, 512) - weaveHeight(x - 1, y, 512)
      const dy = weaveHeight(x, y + 1, 512) - weaveHeight(x, y - 1, 512)
      const nx = -dx * 4
      const ny = dy * 4 // canvas rows run downwards but texture v runs upwards, so no minus here
      const length = Math.hypot(nx, ny, 1)
      const i = (y * 512 + x) * 4
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  carbonNormalCache = tiled(canvas, 1 / WEAVE_TILE_METRES, false)
  return carbonNormalCache
}

// ---------- subtle surface variation (paint, rubber, brakes) ----------

const noiseCache = new Map<string, CanvasTexture | null>()

/**
 * Soft blotchy variation for a roughness map: real surfaces are never perfectly even, and that
 * unevenness in the reflections is a big part of what stops a render looking like plastic.
 * `low`–`high` is the grey range (255 = full roughness); `grain` adds fine speckle.
 */
export function surfaceNoise(seed: number, tilesPerMetre: number, low: number, high: number, grain: number): CanvasTexture | null {
  const key = `${seed}|${tilesPerMetre}|${low}|${high}|${grain}`
  if (noiseCache.has(key)) return noiseCache.get(key) ?? null
  noiseCache.set(key, null)
  const made = canBuild() && canvas2d(256)
  if (!made) return null
  const [canvas, ctx] = made
  const rand = random(seed)
  // Blotches: a tiny random grid scaled up smoothly.
  const small = canvas2d(16)
  if (!small) return null
  const [smallCanvas, smallCtx] = small
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = Math.round(low + (high - low) * rand())
      smallCtx.fillStyle = `rgb(${v},${v},${v})`
      smallCtx.fillRect(x, y, 1, 1)
    }
  }
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(smallCanvas, 0, 0, 256, 256)
  // Fine grain on top.
  const image = ctx.getImageData(0, 0, 256, 256)
  for (let i = 0; i < image.data.length; i += 4) {
    const g = (rand() - 0.5) * grain
    for (let c = 0; c < 3; c++) image.data[i + c] = Math.max(0, Math.min(255, image.data[i + c] + g))
  }
  ctx.putImageData(image, 0, 0)
  const texture = tiled(canvas, tilesPerMetre, false)
  noiseCache.set(key, texture)
  return texture
}

// ---------- radiator fins ----------

let finsCache: CanvasTexture | null | undefined

/** Thin parallel cooling fins, about 2 mm apart. */
export function radiatorFins(): CanvasTexture | null {
  if (finsCache !== undefined) return finsCache
  finsCache = null
  const made = canBuild() && canvas2d(64)
  if (!made) return null
  const [canvas, ctx] = made
  for (let x = 0; x < 64; x++) {
    const v = x % 8 < 2 ? 210 : x % 8 < 4 ? 120 : 70
    ctx.fillStyle = `rgb(${v},${v + 4},${v + 8})`
    ctx.fillRect(x, 0, 1, 64)
  }
  finsCache = tiled(canvas, 62.5, true) // 64 px tile = 8 fins → 16 mm per tile
  return finsCache
}
