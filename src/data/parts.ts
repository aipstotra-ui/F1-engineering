// The part catalog: every part of the RB19, the order it is built in, and what it teaches.
// Numbers in lesson text must come from docs/facts.md; list their IDs in `facts`.

export type SectionId =
  | 'survival-cell'
  | 'power-unit'
  | 'gearbox'
  | 'cooling'
  | 'rear-suspension'
  | 'front-suspension'
  | 'floor'
  | 'sidepods'
  | 'front-wing'
  | 'rear-wing'
  | 'brakes'
  | 'wheels'

export type FactId = `F-${number}`

/** Sim inputs a part can change (used from Step 10 on). */
export type SimInput =
  | 'mass'
  | 'downforce'
  | 'drag'
  | 'aeroBalance'
  | 'power'
  | 'energyRecovery'
  | 'cooling'
  | 'mechanicalGrip'
  | 'tyreGrip'
  | 'braking'
  | 'safety'

export interface Section {
  id: SectionId
  name: string
}

export interface PartSpec {
  id: string
  name: string
  description: string
}

export interface Part {
  id: string
  name: string
  section: SectionId
  /** Parent part for sub-assemblies (Wave 2). */
  parent?: string
  /** 'ai' parts load a .glb model; 'code' parts are built in src/parts/. */
  source: 'ai' | 'code'
  model?: string
  /** Position/rotation on the car in metres/radians. Set with the placement tool in Step 7. */
  attach: { position: [number, number, number]; rotation: [number, number, number] }
  /** Order in the guided build, starting at 1. */
  buildStep: number
  specs?: PartSpec[]
  lesson: { text: string; facts: FactId[] }
  simEffects: SimInput[]
}

/** Sections in real assembly order (also the guided-build order). */
export const SECTIONS: Section[] = [
  { id: 'survival-cell', name: 'Survival cell & cockpit' },
  { id: 'power-unit', name: 'Power unit' },
  { id: 'gearbox', name: 'Gearbox & rear structure' },
  { id: 'cooling', name: 'Cooling' },
  { id: 'rear-suspension', name: 'Rear suspension' },
  { id: 'front-suspension', name: 'Front suspension' },
  { id: 'floor', name: 'Floor & diffuser' },
  { id: 'sidepods', name: 'Sidepods & engine cover' },
  { id: 'front-wing', name: 'Front wing & nose' },
  { id: 'rear-wing', name: 'Rear wing & beam wing' },
  { id: 'brakes', name: 'Brakes' },
  { id: 'wheels', name: 'Wheels & tyres' },
]

/** Shown above the catalog: the car as a whole. */
export const CAR_INTRO = {
  text:
    'The Red Bull RB19 won 21 of the 22 races in 2023. Like every 2023 car, it had to weigh at least ' +
    '798 kg with the driver but without fuel, and its wheelbase could be no longer than 3600 mm.',
  facts: ['F-034', 'F-001', 'F-029'] as FactId[],
}

const ORIGIN: Part['attach'] = { position: [0, 0, 0], rotation: [0, 0, 0] }

type PartInput = Omit<Part, 'buildStep' | 'attach' | 'model'>

// Listed in build order; buildStep, attach and model path are filled in below.
const PART_LIST: PartInput[] = [
  // Survival cell & cockpit
  {
    id: 'monocoque',
    name: 'Survival cell (monocoque)',
    section: 'survival-cell',
    source: 'ai',
    lesson: {
      text:
        'The survival cell is the carbon-fibre core of the car. It holds the fuel tank, the cockpit and part ' +
        'of the hybrid battery, and everything else bolts onto it. It must protect the driver in a crash, so it is ' +
        'very strong and stiff.',
      facts: ['F-031'],
    },
    simEffects: ['mass', 'safety'],
  },
  {
    id: 'halo',
    name: 'Halo',
    section: 'survival-cell',
    source: 'code',
    lesson: {
      text:
        'The halo is the curved bar above the cockpit that shields the driver’s head from flying debris and ' +
        'impacts. Every team uses a halo built to the same FIA standard by an FIA-approved maker.',
      facts: ['F-030'],
    },
    simEffects: ['mass', 'safety'],
  },
  {
    id: 'seat',
    name: 'Seat',
    section: 'survival-cell',
    source: 'ai',
    lesson: {
      text:
        'The seat is moulded to the driver’s body so they are held firmly under huge cornering forces. ' +
        'The driver with seat and equipment must weigh at least 80 kg, so lighter drivers carry ballast to make up ' +
        'the difference.',
      facts: ['F-002'],
    },
    simEffects: ['mass'],
  },
  {
    id: 'steering-wheel',
    name: 'Steering wheel',
    section: 'survival-cell',
    source: 'ai',
    lesson: {
      text:
        'The steering wheel is the driver’s control centre. Besides steering, its buttons and dials let the ' +
        'driver change car settings during a lap, such as how the hybrid system delivers energy.',
      facts: [],
    },
    simEffects: [],
  },

  // Power unit
  {
    id: 'energy-store',
    name: 'Energy Store (battery)',
    section: 'power-unit',
    source: 'ai',
    lesson: {
      text:
        'The Energy Store is the hybrid battery. It stores electrical energy recovered by the MGU-K and MGU-H and ' +
        'gives it back as extra power. Its cells must weigh between 20 and 25 kg.',
      facts: ['F-015'],
    },
    simEffects: ['mass', 'energyRecovery'],
  },
  {
    id: 'control-electronics',
    name: 'Control electronics',
    section: 'power-unit',
    source: 'ai',
    lesson: {
      text:
        'The control electronics are the brain of the power unit. They decide, many times per second, how the ' +
        'engine and the electric motors share the work of driving the car.',
      facts: [],
    },
    simEffects: ['energyRecovery'],
  },
  {
    id: 'v6-engine',
    name: 'V6 turbo engine (ICE)',
    section: 'power-unit',
    source: 'ai',
    lesson: {
      text:
        'The internal combustion engine burns fuel to make most of the car’s power. It is a 1.6-litre (1600 cc) ' +
        'engine with six cylinders in a 90° V, each 80 mm wide, and the fuel it may burn is limited to 100 kg per ' +
        'hour. The whole power unit must weigh at least 151 kg. In the RB19 it was the Honda RBPTH001.',
      facts: ['F-003', 'F-004', 'F-005', 'F-007', 'F-014', 'F-032'],
    },
    simEffects: ['power', 'mass'],
  },
  {
    id: 'turbocharger',
    name: 'Turbocharger',
    section: 'power-unit',
    source: 'ai',
    lesson: {
      text:
        'Hot exhaust gas spins a turbine, which turns a compressor on the same shaft. The compressor squeezes more ' +
        'air into the engine, so it can burn its fuel more completely and make more power.',
      facts: ['F-008'],
    },
    simEffects: ['power'],
  },
  {
    id: 'mgu-h',
    name: 'MGU-H (heat motor-generator)',
    section: 'power-unit',
    source: 'ai',
    lesson: {
      text:
        'The MGU-H sits on the turbocharger shaft and turns spare exhaust energy into electricity. It can also ' +
        'spin the turbo up to remove turbo lag. It may spin at up to 125,000 rpm and must weigh at least 4 kg.',
      facts: ['F-008', 'F-012', 'F-013'],
    },
    simEffects: ['energyRecovery', 'power'],
  },
  {
    id: 'mgu-k',
    name: 'MGU-K (kinetic motor-generator)',
    section: 'power-unit',
    source: 'ai',
    lesson: {
      text:
        'The MGU-K is an electric motor geared to the engine. Under braking it works as a generator and charges ' +
        'the battery; on acceleration it adds up to 120 kW of power. It may spin at up to 50,000 rpm and must weigh ' +
        'at least 7 kg.',
      facts: ['F-009', 'F-010', 'F-011'],
    },
    simEffects: ['power', 'energyRecovery'],
  },
  {
    id: 'exhaust',
    name: 'Exhaust',
    section: 'power-unit',
    source: 'ai',
    lesson: {
      text:
        'The exhaust carries hot gas from the engine through the turbocharger’s turbine and out of the back of the ' +
        'car. Its pipes are shaped to keep the gas flowing smoothly so the turbo gets as much energy as possible.',
      facts: [],
    },
    simEffects: ['power'],
  },
  {
    id: 'intercooler',
    name: 'Intercooler',
    section: 'power-unit',
    source: 'ai',
    lesson: {
      text:
        'Squeezing air in the compressor heats it up. The intercooler cools that air back down before it enters ' +
        'the engine, because cooler air is denser and holds more oxygen for burning fuel.',
      facts: [],
    },
    simEffects: ['power', 'cooling'],
  },

  // Gearbox & rear structure
  {
    id: 'gearbox',
    name: 'Gearbox',
    section: 'gearbox',
    source: 'ai',
    lesson: {
      text:
        'The gearbox has 8 forward gears and keeps the engine in its best speed range, from a slow hairpin to full ' +
        'speed on a straight. Its casing is also structural: the rear suspension and rear wing are mounted on it.',
      facts: ['F-018'],
    },
    simEffects: ['mass', 'power'],
  },
  {
    id: 'rear-crash-structure',
    name: 'Rear impact structure',
    section: 'gearbox',
    source: 'ai',
    lesson: {
      text:
        'The rear impact structure sticks out behind the gearbox. In a crash from behind it crushes in a controlled ' +
        'way, absorbing energy so less of the impact reaches the driver.',
      facts: [],
    },
    simEffects: ['mass', 'safety'],
  },

  // Cooling
  {
    id: 'radiators',
    name: 'Radiators',
    section: 'cooling',
    source: 'ai',
    lesson: {
      text:
        'The radiators sit inside the sidepods and cool the engine’s water. Bigger radiators cool better but need ' +
        'bigger sidepod openings, which add drag. Engineers trade cooling against aerodynamics.',
      facts: [],
    },
    simEffects: ['cooling', 'drag'],
  },
  {
    id: 'oil-cooler',
    name: 'Oil cooler',
    section: 'cooling',
    source: 'ai',
    lesson: {
      text:
        'The oil cooler keeps the engine and gearbox oil at the right temperature. Oil that gets too hot stops ' +
        'protecting the moving parts, which can damage the engine.',
      facts: [],
    },
    simEffects: ['cooling'],
  },

  // Rear suspension
  {
    id: 'rear-suspension-arms',
    name: 'Rear wishbones & push-rods',
    section: 'rear-suspension',
    source: 'code',
    lesson: {
      text:
        'Each wheel is held by six suspension members: wishbones, a track rod and a rod that moves the spring. ' +
        'At the rear the RB19 used push-rods, which push up on the inboard springs as the wheel rises.',
      facts: ['F-019', 'F-033'],
    },
    simEffects: ['mechanicalGrip', 'drag'],
  },
  {
    id: 'rear-uprights',
    name: 'Rear uprights',
    section: 'rear-suspension',
    source: 'ai',
    lesson: {
      text:
        'The upright carries the wheel bearing, the brake and the ends of the suspension members. It joins the ' +
        'wheel to the suspension and must be both light and very stiff.',
      facts: [],
    },
    simEffects: ['mass', 'mechanicalGrip'],
  },
  {
    id: 'rear-rockers-dampers',
    name: 'Rear springs, rockers & dampers',
    section: 'rear-suspension',
    source: 'ai',
    lesson: {
      text:
        'Inside the bodywork, rockers pass the push-rod’s movement to the springs and dampers. Springs hold the car ' +
        'up; dampers stop it bouncing. Stiffer settings keep the floor stable for downforce but give less grip over ' +
        'bumps.',
      facts: [],
    },
    simEffects: ['mechanicalGrip', 'downforce'],
  },

  // Front suspension
  {
    id: 'front-suspension-arms',
    name: 'Front wishbones & pull-rods',
    section: 'front-suspension',
    source: 'code',
    lesson: {
      text:
        'At the front the RB19 used pull-rods: as the wheel rises, the rod pulls on a rocker low in the chassis. ' +
        'Like the rear, each front wheel is held by six suspension members, one of which is linked to the steering.',
      facts: ['F-019', 'F-033'],
    },
    simEffects: ['mechanicalGrip', 'drag', 'aeroBalance'],
  },
  {
    id: 'front-uprights',
    name: 'Front uprights',
    section: 'front-suspension',
    source: 'ai',
    lesson: {
      text:
        'The front uprights also turn when the driver steers. Their shape decides how the wheel tilts as it moves, ' +
        'which affects how well the tyre stays flat on the road in corners.',
      facts: [],
    },
    simEffects: ['mechanicalGrip'],
  },
  {
    id: 'front-rockers-dampers',
    name: 'Front springs, rockers & dampers',
    section: 'front-suspension',
    source: 'ai',
    lesson: {
      text:
        'The front springs and dampers control how much the nose dips under braking. Too soft and the floor scrapes ' +
        'the track; too stiff and the front tyres lose grip over kerbs.',
      facts: [],
    },
    simEffects: ['mechanicalGrip', 'downforce'],
  },

  // Floor & diffuser
  {
    id: 'floor',
    name: 'Floor & venturi tunnels',
    section: 'floor',
    source: 'code',
    lesson: {
      text:
        'On a ground-effect car the floor is a key source of downforce. Tunnels underneath speed the air ' +
        'up, which lowers its pressure and sucks the car to the track. Run it too low and the airflow can stall, ' +
        'making the car bounce (porpoising).',
      facts: [],
    },
    simEffects: ['downforce', 'drag', 'aeroBalance'],
  },
  {
    id: 'plank',
    name: 'Plank & skids',
    section: 'floor',
    source: 'code',
    lesson: {
      text:
        'The plank is a strip fitted under the floor. It wears down if the car runs too low, and the FIA measures ' +
        'it after the race, so it stops teams running dangerously close to the ground.',
      facts: ['F-028'],
    },
    simEffects: ['downforce'],
  },
  {
    id: 'diffuser',
    name: 'Diffuser',
    section: 'floor',
    source: 'code',
    lesson: {
      text:
        'The diffuser is the upswept rear end of the floor. It lets the fast underbody air slow down and rejoin the ' +
        'air behind the car smoothly, which keeps the low pressure under the floor working.',
      facts: [],
    },
    simEffects: ['downforce', 'drag'],
  },

  // Sidepods & engine cover
  {
    id: 'sidepods',
    name: 'Sidepods',
    section: 'sidepods',
    source: 'ai',
    lesson: {
      text:
        'Sidepods hold the radiators and shape the airflow along the car towards the rear. Their shape is one of the ' +
        'most visible design choices; Red Bull redesigned the RB19’s sidepods twice during 2023.',
      facts: ['F-035'],
    },
    simEffects: ['drag', 'downforce', 'cooling'],
  },
  {
    id: 'engine-cover',
    name: 'Engine cover & airbox',
    section: 'sidepods',
    source: 'ai',
    lesson: {
      text:
        'The engine cover wraps the power unit and guides air to the rear wing. The airbox opening above the driver’s ' +
        'head feeds air to the engine.',
      facts: [],
    },
    simEffects: ['drag', 'cooling', 'power'],
  },

  // Front wing & nose
  {
    id: 'nose',
    name: 'Nose (front impact structure)',
    section: 'front-wing',
    source: 'ai',
    lesson: {
      text:
        'The nose holds up the front wing and is also a crash structure: in a head-on impact it crushes in a ' +
        'controlled way to protect the driver.',
      facts: [],
    },
    simEffects: ['safety', 'mass'],
  },
  {
    id: 'front-wing',
    name: 'Front wing',
    section: 'front-wing',
    source: 'code',
    lesson: {
      text:
        'The front wing makes downforce on the front tyres and directs air around the wheels and under the floor. ' +
        'It may have at most 4 elements. More flap angle gives more front grip and moves the aero balance forward.',
      facts: ['F-026'],
    },
    simEffects: ['downforce', 'drag', 'aeroBalance'],
  },

  // Rear wing & beam wing
  {
    id: 'beam-wing',
    name: 'Beam wing',
    section: 'rear-wing',
    source: 'code',
    lesson: {
      text:
        'The beam wing is a small wing low down at the back. It works together with the diffuser and the rear wing ' +
        'to pull air out from under the car, adding rear downforce.',
      facts: [],
    },
    simEffects: ['downforce', 'drag', 'aeroBalance'],
  },
  {
    id: 'rear-wing',
    name: 'Rear wing & DRS flap',
    section: 'rear-wing',
    source: 'code',
    specs: [
      { id: 'low', name: 'Low downforce', description: 'Small, flat wing: less drag for higher top speed, less grip in corners.' },
      { id: 'medium', name: 'Medium downforce', description: 'A balance of corner grip and straight-line speed.' },
      { id: 'high', name: 'High downforce', description: 'Big, steep wing: maximum grip in slow corners, more drag on straights.' },
    ],
    lesson: {
      text:
        'The rear wing makes downforce on the rear tyres. Its top flap can open while the car is moving (DRS), which ' +
        'cuts drag and helps a car overtake on a straight.',
      facts: ['F-027'],
    },
    simEffects: ['downforce', 'drag', 'aeroBalance'],
  },

  // Brakes
  {
    id: 'brake-discs',
    name: 'Brake discs',
    section: 'brakes',
    source: 'code',
    lesson: {
      text:
        'Brakes turn the car’s speed into heat. The discs may be at most 32 mm thick, 325–330 mm across at the front ' +
        'and 275–280 mm at the rear, and they are drilled with tiny holes to cool them.',
      facts: ['F-025'],
    },
    simEffects: ['braking', 'mass'],
  },
  {
    id: 'brake-calipers',
    name: 'Brake calipers',
    section: 'brakes',
    source: 'ai',
    lesson: {
      text:
        'The caliper squeezes the brake pads onto the disc. Each wheel may have one aluminium caliper with up to ' +
        'six pistons.',
      facts: ['F-024'],
    },
    simEffects: ['braking'],
  },
  {
    id: 'brake-ducts',
    name: 'Brake ducts',
    section: 'brakes',
    source: 'ai',
    lesson: {
      text:
        'Brake ducts scoop air onto the brakes to stop them overheating. Bigger ducts cool better but add drag, so ' +
        'teams change them to suit each track.',
      facts: [],
    },
    simEffects: ['braking', 'cooling', 'drag'],
  },

  // Wheels & tyres
  {
    id: 'wheel-rims',
    name: 'Wheel rims',
    section: 'wheels',
    source: 'code',
    lesson: {
      text:
        'The rims are made from magnesium alloy, which is very light, and every team uses the same rim size: the ' +
        'outer lip is 490.6 mm across. Lighter wheels let the suspension react faster to bumps.',
      facts: ['F-020', 'F-021'],
    },
    simEffects: ['mass', 'tyreGrip'],
  },
  {
    id: 'tyres',
    name: 'Tyres',
    section: 'wheels',
    source: 'code',
    lesson: {
      text:
        'The tyres are the only parts touching the track, so every force goes through them. Rear tyres are wider ' +
        '(440–470 mm) than fronts (345–375 mm). In 2023 Pirelli offered 6 dry compounds, from C0 (hardest, lasts ' +
        'longest) to C5 (softest, most grip).',
      facts: ['F-022', 'F-036'],
    },
    simEffects: ['tyreGrip', 'mechanicalGrip'],
  },
]

export const PARTS: Part[] = PART_LIST.map((part, index) => ({
  ...part,
  buildStep: index + 1,
  attach: ORIGIN,
  model: part.source === 'ai' ? `/models/parts/${part.id}.glb` : undefined,
}))

export function partsInSection(section: SectionId): Part[] {
  return PARTS.filter((part) => part.section === section)
}
