import { describe, expect, it } from 'vitest'
import { hpToWatts, kmhToMps, mpsToKmh, wattsToHp } from './units.ts'

const conversions = { kmhToMps, mpsToKmh, hpToWatts, wattsToHp }

describe('speed conversions', () => {
  it('converts 36 km/h to 10 m/s', () => {
    expect(kmhToMps(36)).toBeCloseTo(10)
  })

  it('converts 10 m/s to 36 km/h', () => {
    expect(mpsToKmh(10)).toBeCloseTo(36)
  })

  it('round-trips km/h → m/s → km/h', () => {
    expect(mpsToKmh(kmhToMps(312.5))).toBeCloseTo(312.5)
  })
})

describe('power conversions', () => {
  it('converts 1 hp to 745.7 W', () => {
    expect(hpToWatts(1)).toBeCloseTo(745.7)
  })

  it('converts 745.7 W to 1 hp', () => {
    expect(wattsToHp(745.7)).toBeCloseTo(1)
  })

  it('round-trips W → hp → W', () => {
    expect(hpToWatts(wattsToHp(120_000))).toBeCloseTo(120_000)
  })
})

describe('all conversions', () => {
  it.each(Object.entries(conversions))('%s gives finite results for 0, negative and large inputs', (_, convert) => {
    for (const input of [0, -50, 1e6]) {
      expect(Number.isFinite(convert(input))).toBe(true)
    }
    expect(convert(0)).toBe(0)
  })
})
