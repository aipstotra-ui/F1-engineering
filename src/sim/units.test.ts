import { describe, expect, it } from 'vitest'
import { hpToWatts, kmhToMps, mpsToKmh, wattsToHp } from './units.ts'

describe('speed conversions', () => {
  it('converts 36 km/h to 10 m/s', () => {
    expect(kmhToMps(36)).toBeCloseTo(10)
  })

  it('round-trips km/h → m/s → km/h', () => {
    expect(mpsToKmh(kmhToMps(312.5))).toBeCloseTo(312.5)
  })
})

describe('power conversions', () => {
  it('converts 1 hp to 745.7 W', () => {
    expect(hpToWatts(1)).toBeCloseTo(745.7)
  })

  it('round-trips W → hp → W', () => {
    expect(hpToWatts(wattsToHp(120_000))).toBeCloseTo(120_000)
  })
})
