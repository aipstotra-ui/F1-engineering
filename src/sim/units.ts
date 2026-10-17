// Unit conversions. The sim works in SI units; convert only for display.

const MPS_PER_KMH = 1000 / 3600

export function kmhToMps(speedKmh: number): number {
  return speedKmh * MPS_PER_KMH
}

export function mpsToKmh(speedMps: number): number {
  return speedMps / MPS_PER_KMH
}

const WATTS_PER_HP = 745.7 // mechanical horsepower

export function hpToWatts(powerHp: number): number {
  return powerHp * WATTS_PER_HP
}

export function wattsToHp(powerW: number): number {
  return powerW / WATTS_PER_HP
}
