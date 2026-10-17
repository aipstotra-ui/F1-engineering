# Architecture

## Stack
**App (browser):** Vite + React + TypeScript · three.js via @react-three/fiber, @react-three/drei, @react-three/postprocessing · Zustand · zod (validates untrusted input) · Recharts · Vitest · oxlint · Playwright · @gltf-transform/cli. Hosting: Vercel (connected to the repo; PR previews).

**Python lab (your computer + CI):** Python 3.13 managed by uv · NumPy · SciPy · pandas · FastF1 (real timing/telemetry) · matplotlib (validation plots) · pytest · ruff. Never shipped to the browser.

## Folders
```
src/
  sim/        physics only, no React/three imports: aero.ts, powerUnit.ts, tyres.ts, lapSim.ts + *.test.ts
  data/       parts.ts (part catalog), rb19.ts (stock CarConfig), circuits/*.json, lessons/, missions.ts
  state/      carStore.ts: built parts, chosen specs, adjustments, view mode, build progress
  scene/      Studio.tsx, CameraRig.tsx (fly-to-section), materials.ts, hologramShader.ts
  parts/      code-built parts (FrontWing, RearWing, Floor, Suspension, Wheel, BrakeDisc, Halo) + AiPart.tsx (.glb loader)
  build/      BuildMode, PartsTray, GhostSlot, SnapAnimation, PlacementTool (dev only)
  ui/         HudPanel, Slider, SpecPicker, StatReadout, LessonCard, ModeToggle, theme.css (tokens)
  screens/    Garage, Build, Section, WindTunnel, TrackTest, Race, Learn, Missions
  data/generated/  JSON exported by the Python lab (circuits, fitted car parameters). Never edit by hand.
  sim/__golden__/  golden results from the Python reference sim, used by TS tests
public/models/parts/   cleaned .glb files, one per AI part
lab/                   Python lab (uv project)
  f1lab/      tracks.py, telemetry.py (FastF1), reference_sim.py, fit.py, export.py
  tests/      pytest; tests needing internet are marked `network` and skipped in CI
  notebooks/  optional exploration; results that matter move into f1lab/
  .cache/     FastF1 download cache (git-ignored)
```

## Data flow
```
parts.ts (catalog) ─┐
rb19.ts (stock)  ───┼─> carStore (CarConfig + build state) ─> sim/ (pure functions) ─> stats, lap, telemetry
user input (UI) ────┘                │
                                     └─> scene/parts (render: which parts, which spec, adjustments, view mode)
```
**Python → TypeScript:**
```
FastF1 telemetry + track outlines ─> lab/f1lab (fit + reference sim) ─> src/data/generated/*.json ─> sim/ (TS)
                                                                    └─> src/sim/__golden__/*.json ─> Vitest: TS must match Python
```
- **`CarConfig`** = chosen spec per part + adjustable values (flap angles, ride height, stiffness, brake bias, ERS mode, tyre compound).
- `sim/` functions are pure: `(CarConfig, Circuit) → Result`. There are no globals and no randomness unless it's seeded.

## Part catalog entry (`src/data/parts.ts`)
`id`, `name`, `section`, `parent?`, `source: 'ai' | 'code'`, `model?` (glb path), `attach` (position/rotation), `buildStep`, `specs?` (versions), `adjustables?` (name, min, max, default, unit), `lesson` (2–4 sentences + fact IDs), `simEffects` (which sim inputs it changes).

**Sections (build order):** survival cell & cockpit → power unit → gearbox & rear structure → cooling → rear suspension → front suspension → floor & diffuser → sidepods & engine cover → front wing & nose → rear wing & beam wing → brakes → wheels & tyres.

## Conventions
- SI units inside `sim/` (m, kg, s, N, W, J, rad). Convert only for display.
- Every F1 constant carries a fact-ID comment: `const MIN_MASS_KG = /* value */ // F-001`.
- Components are small and named after the real part. No abbreviations a beginner wouldn't know.
- Shared designs (URL/import) are untrusted: validate against a schema and clamp to `adjustables` ranges before use.
