import type { BufferGeometry } from 'three'

/** Material names; src/scene/materials.ts turns each into a realistic or hologram material. */
export type MaterialKind =
  | 'paint' // matte dark navy bodywork
  | 'paintRed'
  | 'paintYellow'
  | 'carbon' // glossy exposed carbon fibre
  | 'carbonMatte'
  | 'rubber'
  | 'tyreStripe'
  | 'rimMetal' // magnesium alloy wheel rim (F-020)
  | 'titanium'
  | 'aluminium'
  | 'darkMetal'
  | 'heatMetal' // exhausts and turbine: heat-tinted alloy
  | 'brakeCarbon'
  | 'radiator'
  | 'plank'
  | 'black'
  | 'chrome' // mirror glass

/** One mesh of a part: a shape plus what it's made of. Shapes are already placed in the car frame. */
export interface Piece {
  name: string
  material: MaterialKind
  geometry: BufferGeometry
}
